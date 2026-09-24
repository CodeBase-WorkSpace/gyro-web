export type ApiFieldError = {
  field: string;
  errorMessage: string;
};

export type ApiErrorResponse = {
  status: number;
  code?: string;
  reasonCode?: string;
  message: string;
  requestId?: string;
  metadata?: Record<string, string>;
  fieldErrors?: ApiFieldError[];
};

export type ApiFieldErrorMap = Record<string, string>;

export type ApiPageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};
