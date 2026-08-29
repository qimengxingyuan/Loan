import type {
  AddPrepaymentRequest,
  AddRateChangeRequest,
  CreateFixedDebtRequest,
  CreateLoanRequest,
  PrepaymentType,
  RepaymentMethod,
  UpdateLoanRequest,
} from '../../../shared/types.ts';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const repaymentMethods = ['equal_installment', 'equal_principal', 'equal_principal_interest', 'free_repayment'] as const;
const prepaymentTypes = ['reduce_term', 'reduce_payment'] as const;

function assertObject(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Request body must be an object');
  }
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new Error(`${field} must be a string`);
  return value;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function optionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
  return value;
}

function requiredPositiveNumber(value: unknown, field: string): number {
  const num = optionalNumber(value, field);
  if (num === undefined || num <= 0) throw new Error(`${field} must be greater than 0`);
  return num;
}

function requiredPositiveInteger(value: unknown, field: string): number {
  const num = requiredPositiveNumber(value, field);
  if (!Number.isInteger(num)) throw new Error(`${field} must be an integer`);
  return num;
}

function requiredDate(value: unknown, field: string): string {
  const date = requiredString(value, field);
  if (!datePattern.test(date) || Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
    throw new Error(`${field} must be a valid YYYY-MM-DD date`);
  }
  return date;
}

function optionalDate(value: unknown, field: string): string | undefined {
  if (value === undefined || value === '') return undefined;
  return requiredDate(value, field);
}

function validatePaymentDay(value: unknown): number {
  const paymentDay = requiredPositiveInteger(value, 'paymentDay');
  if (paymentDay < 1 || paymentDay > 31) throw new Error('paymentDay must be between 1 and 31');
  return paymentDay;
}

function validateRepaymentMethod(value: unknown): RepaymentMethod {
  if (!repaymentMethods.includes(value as RepaymentMethod)) {
    throw new Error('method is invalid');
  }
  return value as RepaymentMethod;
}

function validatePrepaymentType(value: unknown): PrepaymentType {
  if (!prepaymentTypes.includes(value as PrepaymentType)) {
    throw new Error('type is invalid');
  }
  return value as PrepaymentType;
}

export function validateCreateLoanRequest(body: unknown): CreateLoanRequest {
  assertObject(body);
  const request: CreateLoanRequest = {
    name: requiredString(body.name, 'name'),
    totalAmount: requiredPositiveNumber(body.totalAmount, 'totalAmount'),
    totalMonths: requiredPositiveInteger(body.totalMonths, 'totalMonths'),
    method: validateRepaymentMethod(body.method),
    loanDate: requiredDate(body.loanDate, 'loanDate'),
    paymentDay: validatePaymentDay(body.paymentDay),
    initialRate: optionalNumber(body.initialRate, 'initialRate') ?? (() => {
      throw new Error('initialRate is required');
    })(),
  };
  if (request.initialRate < 0) throw new Error('initialRate cannot be negative');

  const minimumPayment = optionalNumber(body.minimumPayment, 'minimumPayment');
  if (minimumPayment !== undefined) {
    if (minimumPayment <= 0) throw new Error('minimumPayment must be greater than 0');
    request.minimumPayment = minimumPayment;
  }

  const icon = optionalString(body.icon, 'icon');
  if (icon !== undefined) request.icon = icon;

  return request;
}

export function validateUpdateLoanRequest(body: unknown): UpdateLoanRequest {
  assertObject(body);
  const request: UpdateLoanRequest = {};

  const name = optionalString(body.name, 'name');
  if (name !== undefined) {
    if (name.trim() === '') throw new Error('name cannot be empty');
    request.name = name.trim();
  }

  const totalAmount = optionalNumber(body.totalAmount, 'totalAmount');
  if (totalAmount !== undefined) {
    if (totalAmount <= 0) throw new Error('totalAmount must be greater than 0');
    request.totalAmount = totalAmount;
  }

  const totalMonths = optionalNumber(body.totalMonths, 'totalMonths');
  if (totalMonths !== undefined) {
    if (!Number.isInteger(totalMonths) || totalMonths <= 0) throw new Error('totalMonths must be a positive integer');
    request.totalMonths = totalMonths;
  }

  if (body.method !== undefined) request.method = validateRepaymentMethod(body.method);
  if (body.loanDate !== undefined) request.loanDate = requiredDate(body.loanDate, 'loanDate');
  if (body.paymentDay !== undefined) request.paymentDay = validatePaymentDay(body.paymentDay);

  const initialRate = optionalNumber(body.initialRate, 'initialRate');
  if (initialRate !== undefined) {
    if (initialRate < 0) throw new Error('initialRate cannot be negative');
    request.initialRate = initialRate;
  }

  const minimumPayment = optionalNumber(body.minimumPayment, 'minimumPayment');
  if (minimumPayment !== undefined) {
    if (minimumPayment <= 0) throw new Error('minimumPayment must be greater than 0');
    request.minimumPayment = minimumPayment;
  }

  const icon = optionalString(body.icon, 'icon');
  if (icon !== undefined) request.icon = icon;

  return request;
}

export function validateCreateFixedDebtRequest(body: unknown): CreateFixedDebtRequest {
  assertObject(body);
  const request: CreateFixedDebtRequest = {
    name: requiredString(body.name, 'name'),
    amount: requiredPositiveNumber(body.amount, 'amount'),
    debtDate: requiredDate(body.debtDate, 'debtDate'),
  };

  const description = optionalString(body.description, 'description');
  if (description !== undefined) request.description = description;

  return request;
}

export function validateUpdateFixedDebtRequest(body: unknown): Partial<CreateFixedDebtRequest> {
  assertObject(body);
  const request: Partial<CreateFixedDebtRequest> = {};

  const name = optionalString(body.name, 'name');
  if (name !== undefined) {
    if (name.trim() === '') throw new Error('name cannot be empty');
    request.name = name.trim();
  }

  const amount = optionalNumber(body.amount, 'amount');
  if (amount !== undefined) {
    if (amount <= 0) throw new Error('amount must be greater than 0');
    request.amount = amount;
  }

  const description = optionalString(body.description, 'description');
  if (description !== undefined) request.description = description;
  if (body.debtDate !== undefined) request.debtDate = requiredDate(body.debtDate, 'debtDate');

  return request;
}

export function validateAddRateChangeRequest(body: unknown): AddRateChangeRequest {
  assertObject(body);
  const request = {
    effectiveDate: requiredDate(body.effectiveDate, 'effectiveDate'),
    endDate: optionalDate(body.endDate, 'endDate'),
    annualRate: optionalNumber(body.annualRate, 'annualRate') ?? (() => {
      throw new Error('annualRate is required');
    })(),
  };
  if (request.annualRate < 0) throw new Error('annualRate cannot be negative');
  if (request.endDate && request.endDate <= request.effectiveDate) {
    throw new Error('endDate must be later than effectiveDate');
  }
  return request;
}

export function validateAddPrepaymentRequest(body: unknown): AddPrepaymentRequest {
  assertObject(body);
  return {
    paymentDate: requiredDate(body.paymentDate, 'paymentDate'),
    amount: requiredPositiveNumber(body.amount, 'amount'),
    type: validatePrepaymentType(body.type),
  };
}
