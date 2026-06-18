import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { Bill, BillInput, BillStats, ErrorResponse, HealthStatus, Product, ProductInput, ProductUpdate } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListProductsUrl: () => string;
/**
 * @summary List all products
 */
export declare const listProducts: (options?: RequestInit) => Promise<Product[]>;
export declare const getListProductsQueryKey: () => readonly ["/api/products"];
export declare const getListProductsQueryOptions: <TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProductsQueryResult = NonNullable<Awaited<ReturnType<typeof listProducts>>>;
export type ListProductsQueryError = ErrorType<unknown>;
/**
 * @summary List all products
 */
export declare function useListProducts<TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateProductUrl: () => string;
/**
 * @summary Create or update a product
 */
export declare const createProduct: (productInput: ProductInput, options?: RequestInit) => Promise<Product>;
export declare const getCreateProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
        data: BodyType<ProductInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
    data: BodyType<ProductInput>;
}, TContext>;
export type CreateProductMutationResult = NonNullable<Awaited<ReturnType<typeof createProduct>>>;
export type CreateProductMutationBody = BodyType<ProductInput>;
export type CreateProductMutationError = ErrorType<unknown>;
/**
* @summary Create or update a product
*/
export declare const useCreateProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
        data: BodyType<ProductInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createProduct>>, TError, {
    data: BodyType<ProductInput>;
}, TContext>;
export declare const getGetProductByBarcodeUrl: (barcode: string) => string;
/**
 * @summary Look up product by barcode
 */
export declare const getProductByBarcode: (barcode: string, options?: RequestInit) => Promise<Product>;
export declare const getGetProductByBarcodeQueryKey: (barcode: string) => readonly [`/api/products/barcode/${string}`];
export declare const getGetProductByBarcodeQueryOptions: <TData = Awaited<ReturnType<typeof getProductByBarcode>>, TError = ErrorType<ErrorResponse>>(barcode: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProductByBarcode>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProductByBarcode>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProductByBarcodeQueryResult = NonNullable<Awaited<ReturnType<typeof getProductByBarcode>>>;
export type GetProductByBarcodeQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Look up product by barcode
 */
export declare function useGetProductByBarcode<TData = Awaited<ReturnType<typeof getProductByBarcode>>, TError = ErrorType<ErrorResponse>>(barcode: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProductByBarcode>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateProductUrl: (id: number) => string;
/**
 * @summary Update a product
 */
export declare const updateProduct: (id: number, productUpdate: ProductUpdate, options?: RequestInit) => Promise<Product>;
export declare const getUpdateProductMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, {
        id: number;
        data: BodyType<ProductUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, {
    id: number;
    data: BodyType<ProductUpdate>;
}, TContext>;
export type UpdateProductMutationResult = NonNullable<Awaited<ReturnType<typeof updateProduct>>>;
export type UpdateProductMutationBody = BodyType<ProductUpdate>;
export type UpdateProductMutationError = ErrorType<ErrorResponse>;
/**
* @summary Update a product
*/
export declare const useUpdateProduct: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, {
        id: number;
        data: BodyType<ProductUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateProduct>>, TError, {
    id: number;
    data: BodyType<ProductUpdate>;
}, TContext>;
export declare const getDeleteProductUrl: (id: number) => string;
/**
 * @summary Delete a product
 */
export declare const deleteProduct: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
    id: number;
}, TContext>;
export type DeleteProductMutationResult = NonNullable<Awaited<ReturnType<typeof deleteProduct>>>;
export type DeleteProductMutationError = ErrorType<unknown>;
/**
* @summary Delete a product
*/
export declare const useDeleteProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteProduct>>, TError, {
    id: number;
}, TContext>;
export declare const getListBillsUrl: () => string;
/**
 * @summary List all saved bills
 */
export declare const listBills: (options?: RequestInit) => Promise<Bill[]>;
export declare const getListBillsQueryKey: () => readonly ["/api/bills"];
export declare const getListBillsQueryOptions: <TData = Awaited<ReturnType<typeof listBills>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBills>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listBills>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListBillsQueryResult = NonNullable<Awaited<ReturnType<typeof listBills>>>;
export type ListBillsQueryError = ErrorType<unknown>;
/**
 * @summary List all saved bills
 */
export declare function useListBills<TData = Awaited<ReturnType<typeof listBills>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBills>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateBillUrl: () => string;
/**
 * @summary Save a new bill
 */
export declare const createBill: (billInput: BillInput, options?: RequestInit) => Promise<Bill>;
export declare const getCreateBillMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createBill>>, TError, {
        data: BodyType<BillInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createBill>>, TError, {
    data: BodyType<BillInput>;
}, TContext>;
export type CreateBillMutationResult = NonNullable<Awaited<ReturnType<typeof createBill>>>;
export type CreateBillMutationBody = BodyType<BillInput>;
export type CreateBillMutationError = ErrorType<unknown>;
/**
* @summary Save a new bill
*/
export declare const useCreateBill: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createBill>>, TError, {
        data: BodyType<BillInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createBill>>, TError, {
    data: BodyType<BillInput>;
}, TContext>;
export declare const getGetBillStatsUrl: () => string;
/**
 * @summary Get billing statistics (total bills, revenue today, total revenue)
 */
export declare const getBillStats: (options?: RequestInit) => Promise<BillStats>;
export declare const getGetBillStatsQueryKey: () => readonly ["/api/bills/stats"];
export declare const getGetBillStatsQueryOptions: <TData = Awaited<ReturnType<typeof getBillStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBillStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBillStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBillStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getBillStats>>>;
export type GetBillStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get billing statistics (total bills, revenue today, total revenue)
 */
export declare function useGetBillStats<TData = Awaited<ReturnType<typeof getBillStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBillStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetBillUrl: (id: number) => string;
/**
 * @summary Get a single bill
 */
export declare const getBill: (id: number, options?: RequestInit) => Promise<Bill>;
export declare const getGetBillQueryKey: (id: number) => readonly [`/api/bills/${number}`];
export declare const getGetBillQueryOptions: <TData = Awaited<ReturnType<typeof getBill>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBill>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBill>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBillQueryResult = NonNullable<Awaited<ReturnType<typeof getBill>>>;
export type GetBillQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a single bill
 */
export declare function useGetBill<TData = Awaited<ReturnType<typeof getBill>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBill>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeleteBillUrl: (id: number) => string;
/**
 * @summary Delete a bill
 */
export declare const deleteBill: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteBillMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteBill>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteBill>>, TError, {
    id: number;
}, TContext>;
export type DeleteBillMutationResult = NonNullable<Awaited<ReturnType<typeof deleteBill>>>;
export type DeleteBillMutationError = ErrorType<unknown>;
/**
* @summary Delete a bill
*/
export declare const useDeleteBill: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteBill>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteBill>>, TError, {
    id: number;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map