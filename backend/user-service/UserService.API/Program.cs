using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Reflection;
using System.Text;
using UserService.Application.Common.Interfaces;
using UserService.Application.Common.Mappings;
using UserService.Infrastructure.Data;
using UserService.Infrastructure.Repositories;
using UserService.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/user-service-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Application Services
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(
    typeof(UserService.Application.Users.Commands.CreateUser.CreateUserCommand).Assembly));

builder.Services.AddAutoMapper(typeof(MappingProfile));

builder.Services.AddValidatorsFromAssembly(
    typeof(UserService.Application.Users.Commands.CreateUser.CreateUserCommandValidator).Assembly);

// Infrastructure Services
builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddSingleton<IDateTimeService, DateTimeService>();

// HTTP Context
builder.Services.AddHttpContextAccessor();

// Authentication & Authorization
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured")))
        };
    });

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Health Checks
builder.Services.AddHealthChecks()
    .AddDbContext<ApplicationDbContext>();

// API Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "User Service API",
        Version = "v1",
        Description = "E-commerce User Management Service",
        Contact = new OpenApiContact
        {
            Name = "Development Team",
            Email = "dev@ecommerce.com"
        }
    });

    // JWT Authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Include XML comments
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// Metrics and Monitoring
builder.Services.AddApplicationInsightsTelemetry();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "User Service API v1");
        c.RoutePrefix = string.Empty; // Serve Swagger UI at root
    });
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.UseRouting();

// Health Check endpoint
app.MapHealthChecks("/health");

app.MapControllers();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    if (app.Environment.IsDevelopment())
    {
        // Auto-migrate in development
        await context.Database.MigrateAsync();
    }
    
    // Seed initial data
    await SeedData(context);
}

try
{
    Log.Information("Starting User Service API");
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "User Service API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

static async Task SeedData(ApplicationDbContext context)
{
    try
    {
        // Seed default roles if they don't exist
        if (!context.Roles.Any())
        {
            var roles = new[]
            {
                UserService.Domain.Entities.Role.CreateAdminRole(),
                UserService.Domain.Entities.Role.CreateCustomerRole(),
                UserService.Domain.Entities.Role.CreateManagerRole(),
                UserService.Domain.Entities.Role.CreateSupportRole()
            };

            context.Roles.AddRange(roles);
            await context.SaveChangesAsync();
        }

        // Seed default permissions if they don't exist
        if (!context.Permissions.Any())
        {
            var permissions = new[]
            {
                UserService.Domain.Entities.Permission.CommonPermissions.CreateUserRead(),
                UserService.Domain.Entities.Permission.CommonPermissions.CreateUserWrite(),
                UserService.Domain.Entities.Permission.CommonPermissions.CreateUserDelete(),
                UserService.Domain.Entities.Permission.CommonPermissions.CreateOrderRead(),
                UserService.Domain.Entities.Permission.CommonPermissions.CreateOrderWrite(),
                UserService.Domain.Entities.Permission.CommonPermissions.CreateProductRead(),
                UserService.Domain.Entities.Permission.CommonPermissions.CreateProductWrite(),
                UserService.Domain.Entities.Permission.CommonPermissions.CreateAdminAccess()
            };

            context.Permissions.AddRange(permissions);
            await context.SaveChangesAsync();
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Error seeding database");
    }
}
