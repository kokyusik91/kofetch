// core.ts

import {
  InitConfig,
  InterceptorObjectType,
  NextCustomHeaderConfig,
  OnRequestFailCallback,
  OnResponseFailCallback,
  OnSuccessCallback,
  QueryParamsObjectType,
  RequestBodyType,
} from "./type.js";

class EnhancedError extends Error {
  constructor(public statusCode: number, public response: any, public details: any) {
    super(`Response failed: ${statusCode}`);
  }
}

class FetchConfig {
  // URL 파라미터 파싱
  protected parsingParams(params: QueryParamsObjectType): string {
    return Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }

  // 에러 DTO 생성
  protected async generateErrorDto(response: Response): Promise<EnhancedError> {
    const contentType = response.headers.get('Content-Type');
    const responseDto = contentType && contentType.includes('application/json')
      ? await response.json()
      : await response.text();
    return new EnhancedError(response.status, responseDto, {
      requestUrl: response.url,
      requestHeaders: response.headers,
      message: response.statusText,
    });
  }

  // 요청 후 처리
  protected async handleAfterFetch(
    res: Response,
    responseSuccessHandler?: OnSuccessCallback
  ): Promise<any> {
    if (!res.ok) {
      throw await this.generateErrorDto(res);
    }
    const result = await res.json();
    return responseSuccessHandler ? responseSuccessHandler(result) : result;
  }

  // 에러 핸들링
  protected async handleFetchError(
    err: any,
    requestFailHandler?: OnRequestFailCallback,
    responseFailHandler?: OnResponseFailCallback
  ): Promise<never> {
    if (err instanceof TypeError) {
      return requestFailHandler ? requestFailHandler(err) : Promise.reject(err);
    }
    return responseFailHandler ? responseFailHandler(err) : Promise.reject(err);
  }

  // HTTP 요청 생성
  private async makeRequest<T>(
    url: string,
    method: string,
    data?: RequestBodyType | null,
    params?: QueryParamsObjectType,
    headerOptions?: NextCustomHeaderConfig,
    interceptorObject?: InterceptorObjectType
  ): Promise<T> {
    const fullUrl = `${this.baseUrl}${url}${params ? '?' + this.parsingParams(params) : ''}`;
    const updatedHeaderOptions = interceptorObject?.beforeRequestHandler
      ? interceptorObject.beforeRequestHandler(headerOptions || {})
      : headerOptions;

    const init: RequestInit = {
      method,
      headers: { ...this.defaultHeader, ...updatedHeaderOptions },
      body: data ? JSON.stringify(data) : null,
    };

    return fetch(fullUrl, init)
      .then((res) => this.handleAfterFetch(res, interceptorObject?.responseOnSuccessHandler))
      .catch((err) => this.handleFetchError(err, interceptorObject?.requestOnFailHandler, interceptorObject?.responseOnFailHandler));
  }
}

export default class InitFetchInstance extends FetchConfig {
  constructor(
    private readonly baseUrl?: string,
    private readonly defaultHeader?: NextCustomHeaderConfig,
    private readonly interceptorObject?: InterceptorObjectType
  ) {
    super();
  }

  static create(config: InitConfig): InitFetchInstance {
    const { baseUrl, interceptor, ...rest } = config;
    const defaultHeader: NextCustomHeaderConfig = { ...rest };
    return new InitFetchInstance(baseUrl, defaultHeader, interceptor);
  }

  // 각 HTTP 메서드에 대한 구현
  async get<T>(url: string, params?: QueryParamsObjectType, headerOptions?: NextCustomHeaderConfig): Promise<T> {
    return this.makeRequest<T>(url, 'GET', null, params, headerOptions, this.interceptorObject);
  }

  async post<T>(url: string, data: RequestBodyType, headerOptions?: NextCustomHeaderConfig): Promise<T> {
    return this.makeRequest<T>(url, 'POST', data, undefined, headerOptions, this.interceptorObject);
  }

  async put<T>(
    url: string,
    data: RequestBodyType,
    headerOptions?: NextCustomHeaderConfig
  ): Promise<T> {
    return this.makeRequest<T>(url, 'PUT', data, undefined, headerOptions, this.interceptorObject);
  }

  async patch<T>(
    url: string,
    data: RequestBodyType,
    headerOptions?: NextCustomHeaderConfig
  ): Promise<T> {
    return this.makeRequest<T>(url, 'PATCH', data, undefined, headerOptions, this.interceptorObject);
  }

  async delete<T>(
    url: string,
    headerOptions?: NextCustomHeaderConfig
  ): Promise<T> {
    return this.makeRequest<T>(url, 'DELETE', null, undefined, headerOptions, this.interceptorObject);
  }
}
