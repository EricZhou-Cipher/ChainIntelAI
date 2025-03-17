import { AppError, ErrorType, ErrorDetails } from '../../../utils/errors';

describe('AppError', () => {
  describe('constructor', () => {
    it('should create an error with default values', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.INTERNAL);
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({});
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.stack).toBeDefined();
    });
    
    it('should create an error with custom values', () => {
      const details: ErrorDetails = { field: 'test', code: '123' };
      const error = new AppError(
        'Custom error',
        ErrorType.VALIDATION,
        400,
        details,
        false
      );
      
      expect(error.message).toBe('Custom error');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
      expect(error.isOperational).toBe(false);
    });
  });
  
  describe('static factory methods', () => {
    it('should create a validation error', () => {
      const error = AppError.validation('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });
    
    it('should create a database error', () => {
      const error = AppError.database('Database connection failed');
      
      expect(error.message).toBe('Database connection failed');
      expect(error.type).toBe(ErrorType.DATABASE);
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });
    
    it('should create a not found error', () => {
      const error = AppError.notFound('Resource not found');
      
      expect(error.message).toBe('Resource not found');
      expect(error.type).toBe(ErrorType.NOT_FOUND);
      expect(error.statusCode).toBe(404);
    });
    
    it('should convert a standard Error to AppError', () => {
      const standardError = new Error('Standard error');
      const appError = AppError.fromError(standardError);
      
      expect(appError.message).toBe('Standard error');
      expect(appError.type).toBe(ErrorType.UNKNOWN);
      expect(appError.statusCode).toBe(500);
      expect(appError.isOperational).toBe(false);
      expect(appError.details.cause).toBe(standardError);
    });
    
    it('should convert a standard Error to AppError with custom type', () => {
      const standardError = new Error('Network error');
      const appError = AppError.fromError(standardError, ErrorType.NETWORK);
      
      expect(appError.message).toBe('Network error');
      expect(appError.type).toBe(ErrorType.NETWORK);
    });
  });
  
  describe('toJSON', () => {
    it('should serialize error to JSON', () => {
      const error = new AppError('Test error');
      const json = error.toJSON();
      
      expect(json.name).toBe('AppError');
      expect(json.message).toBe('Test error');
      expect(json.type).toBe(ErrorType.INTERNAL);
      expect(json.statusCode).toBe(500);
      expect(json.details).toEqual({});
      expect(json.timestamp).toBeDefined();
      expect(json.stack).toBeDefined();
    });
  });
}); 