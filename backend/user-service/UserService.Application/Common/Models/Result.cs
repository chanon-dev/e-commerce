namespace UserService.Application.Common.Models;

public class Result
{
    public bool IsSuccess { get; private set; }
    public bool IsFailure => !IsSuccess;
    public string Error { get; private set; } = string.Empty;
    public List<string> Errors { get; private set; } = new();

    protected Result(bool isSuccess, string error)
    {
        IsSuccess = isSuccess;
        Error = error;
        if (!string.IsNullOrEmpty(error))
            Errors.Add(error);
    }

    protected Result(bool isSuccess, List<string> errors)
    {
        IsSuccess = isSuccess;
        Errors = errors ?? new List<string>();
        Error = errors?.FirstOrDefault() ?? string.Empty;
    }

    public static Result Success() => new(true, string.Empty);
    public static Result Failure(string error) => new(false, error);
    public static Result Failure(List<string> errors) => new(false, errors);

    public static implicit operator Result(string error) => Failure(error);
}

public class Result<T> : Result
{
    public T? Value { get; private set; }

    private Result(bool isSuccess, T? value, string error) : base(isSuccess, error)
    {
        Value = value;
    }

    private Result(bool isSuccess, T? value, List<string> errors) : base(isSuccess, errors)
    {
        Value = value;
    }

    public static Result<T> Success(T value) => new(true, value, string.Empty);
    public static new Result<T> Failure(string error) => new(false, default, error);
    public static new Result<T> Failure(List<string> errors) => new(false, default, errors);

    public static implicit operator Result<T>(T value) => Success(value);
    public static implicit operator Result<T>(string error) => Failure(error);
}

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;

    public PagedResult() { }

    public PagedResult(IEnumerable<T> items, int totalCount, int page, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        Page = page;
        PageSize = pageSize;
    }

    public static PagedResult<T> Create(IEnumerable<T> items, int totalCount, int page, int pageSize)
    {
        return new PagedResult<T>(items, totalCount, page, pageSize);
    }
}

public class ValidationResult : Result
{
    public Dictionary<string, List<string>> ValidationErrors { get; private set; } = new();

    private ValidationResult(bool isSuccess, Dictionary<string, List<string>> validationErrors) 
        : base(isSuccess, validationErrors.SelectMany(x => x.Value).ToList())
    {
        ValidationErrors = validationErrors;
    }

    public static ValidationResult Success() => new(true, new Dictionary<string, List<string>>());
    
    public static ValidationResult Failure(Dictionary<string, List<string>> validationErrors) 
        => new(false, validationErrors);
    
    public static ValidationResult Failure(string field, string error)
    {
        var errors = new Dictionary<string, List<string>>
        {
            { field, new List<string> { error } }
        };
        return new ValidationResult(false, errors);
    }

    public bool HasValidationErrors => ValidationErrors.Any();
    
    public List<string> GetFieldErrors(string field)
    {
        return ValidationErrors.TryGetValue(field, out var errors) ? errors : new List<string>();
    }
}

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string> Errors { get; set; } = new();
    public Dictionary<string, object> Metadata { get; set; } = new();

    public static ApiResponse<T> SuccessResponse(T data, string message = "")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Data = data,
            Message = message
        };
    }

    public static ApiResponse<T> ErrorResponse(string error)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Errors = new List<string> { error }
        };
    }

    public static ApiResponse<T> ErrorResponse(List<string> errors)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Errors = errors
        };
    }

    public static ApiResponse<T> ValidationErrorResponse(Dictionary<string, List<string>> validationErrors)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Errors = validationErrors.SelectMany(x => x.Value).ToList(),
            Metadata = new Dictionary<string, object> { { "ValidationErrors", validationErrors } }
        };
    }
}
