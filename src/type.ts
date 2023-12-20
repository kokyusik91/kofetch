// Next.js header config 옵션
export interface NextFetchRequestConfig {
  revalidate?: number | false;
  tags?: string[];
}

export interface NextCustomHeaderConfig extends RequestInit {
  next?: NextFetchRequestConfig | undefined;
}

export type initType = { baseUrl: string } & NextCustomHeaderConfig & {
    interceptor: InterceptorObjectType;
  };
export type QueryParamsObjectType = Record<string, string | number | boolean>;
export type RequestBodyType = Record<string, any>;

export type TODO = {
  completed: boolean;
  id: number;
  title: string;
  userId: number;
};

export type InterceptorObjectType = {
  beforeRequestHandler?: (
    headerOption: NextCustomHeaderConfig
  ) => NextCustomHeaderConfig;
  requestOnFailHandler?: (error: any) => Promise<never>;
  responseOnSuccessHandler?: (response: Promise<any>) => any;
  responseOnFailHandler?: (error: any) => Promise<never>;
};
export type BeforeRequsetCallback =
  InterceptorObjectType["beforeRequestHandler"];
export type OnSuccessCallback =
  InterceptorObjectType["responseOnSuccessHandler"];
export type OnRequestFailCallback =
  InterceptorObjectType["requestOnFailHandler"];
export type OnResponseFailCallback =
  InterceptorObjectType["responseOnFailHandler"];

export type Interceptor = {
  interceptor: InterceptorObjectType;
};

export type InitConfig = NextCustomHeaderConfig & Interceptor;
