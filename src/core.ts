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

/**
 * 해당 클래스는 fetch에서 일반적으로 쓰이는 공통 함수들을 묶었음.
 */
class FetchConfig {
  /**
   *
   * @param params Record<sting,any> 타입의 객체
   * 예시) {age : 28, isKorean : false}
   *
   * @returns 쿼리스트링 형태의 문자열을 반환
   * 예시) ?age=28&isKorean=false
   */
  protected parsingParams(params: QueryParamsObjectType) {
    let queryString = "";

    for (const key of Object.keys(params)) {
      const value = params[key];
      const encodedValue = encodeURIComponent(String(value));
      queryString += `&${key}=${encodedValue}`;
    }
    queryString = queryString.slice(1);
    return `?${queryString}`;
  }
  /**
   *
   * @param response fetch Response
   * @returns axiosError 객체와 마찬가지로, errorDto를 만들어서 실제 에러 핸들링을 해야하는 곳에 던져야함.
   */
protected async generateErrorDto(response: Response) {
  const statusCode = response.status;
  const name = `Response failed: ${statusCode}`;
  const requestUrl = response.url;
  const requestHeaders = response.headers;
  const message = response.statusText;

  // Content-Type 헤더 확인
  const contentType = response.headers.get('Content-Type');

  let responseDto;
  if (contentType && contentType.includes('application/json')) {
    // 응답이 JSON 형식이라면 JSON으로 파싱
    responseDto = await response.json();
  } else {
    // JSON 형식이 아닌 경우, 텍스트로 처리
    responseDto = await response.text();
  }

  return {
    statusCode,
    name,
    responseDto,
    requestUrl,
    requestHeaders,
    message,
  };
}
  /**
   * fetch가 일어난 다음 실행되는 함수
   * @param res Response 객체
   * @param responseSuccessHandler 응답 성공했을때의 핸들러
   * @returns 요청 실패하면 errorDto룰 요청 성공하면 result를 리턴한다.
   */
  protected async handleAfterFetch(
    res: Response,
    responseSuccessHandler?: OnSuccessCallback
  ) {
    // HTTP 요청 실패
    if (!res.ok) {
      const errorDto = await this.generateErrorDto(res);
      // 뭔가 error dto를 만들어주는 작업을 여기서 해야할듯 함..
      return Promise.reject(errorDto);
    }
    // HTTP 요청이 성공하면 (200 ~ 299 status code)
    const result = res.json();
    if (responseSuccessHandler) {
      return responseSuccessHandler(result);
    }
    return result;
  }
  /**
   *
   * @param err 에러 객체
   * @param requestFailHandler 요청 실패 했을때 실행되는 함수 (예) 네트워크 오류, 서버의 CORS 설정 잘못됨)
   * @param responseFailHandler  응답 실패 했을때 실행되는 함수
   * @returns 에러 객체를 throw 한다.
   */
  protected async handleFetchError(
    err: any,
    requestFailHandler?: OnRequestFailCallback,
    responseFailHandler?: OnResponseFailCallback
  ) {
    // fetch() 프로미스는 네트워크에 오류가 있었거나, 서버의 CORS 설정이 잘못된 경우 TypeError로 거부됩니다. - MDN
    if (err instanceof TypeError) {
      return requestFailHandler?.(err);
    }
    //  응답 오류들
    if (responseFailHandler) {
      return responseFailHandler(err);
    }
    return Promise.reject(err);
  }
}

/**
 * fetch instance 초기화 할때 실행시킬 class
 * @param baseUrl (옵셔널) base url
 * @param defaultHeader (옵셔널) 최초 인스턴스를 생성할때 request header를 설정해 주고 싶다면 넘김
 * @param interceptorObject (옵셔널) 인터셉터를 추가하고 싶다면 넘김
 */
export default class InitFetchInstance extends FetchConfig {
  constructor(
    private readonly baseUrl?: string,
    private readonly defaultHeader?: NextCustomHeaderConfig,
    private readonly interceptorObject?: InterceptorObjectType
  ) {
    super();

    (this.baseUrl = baseUrl),
      (this.defaultHeader = defaultHeader),
      (this.interceptorObject = interceptorObject);
  }

  static create({
    baseUrl = "",
    ...config
  }: { baseUrl?: string } & Partial<InitConfig>) {
    // config에 포함된 interceptor 분리 하기 위함.
    const { interceptor, ...rest } = config;
    // 나머지 config header는 다시 묶음.
    const defaultHeader: NextCustomHeaderConfig = { ...rest };
    // 새로운 fetch Instance 생성
    return new InitFetchInstance(baseUrl, defaultHeader, interceptor);
  }

  async get<T>(
    url: string,
    params?: QueryParamsObjectType,
    headerOptions?: NextCustomHeaderConfig
  ): Promise<T> {
    // fetch가 일어나기 전에 먼저 실행
    const updatedHeaderOptions = this.interceptorObject?.beforeRequestHandler?.(
      headerOptions || {}
    );
    return fetch(
      `${this.baseUrl}${url}${params ? this.parsingParams(params) : ""}`,
      {
        method: "get",
        ...this.defaultHeader,
        ...updatedHeaderOptions,
      }
    )
      .then((res) =>
        this.handleAfterFetch(
          res,
          this.interceptorObject?.responseOnSuccessHandler
        )
      )
      .catch((err) =>
        this.handleFetchError(
          err,
          this.interceptorObject?.requestOnFailHandler,
          this.interceptorObject?.responseOnFailHandler
        )
      );
  }

  async post<T>(
    url: string,
    data: RequestBodyType | null,
    headerOptions?: NextCustomHeaderConfig
  ): Promise<T> {
    // fetch가 일어나기 전에 먼저 실행
    const updatedHeaderOptions = this.interceptorObject?.beforeRequestHandler?.(
      headerOptions || {}
    );
    return fetch(`${this.baseUrl}${url}`, {
      method: "post",
      body: JSON.stringify(data),
      ...this.defaultHeader,
      ...updatedHeaderOptions,
    })
      .then((res) =>
        this.handleAfterFetch(
          res,
          this.interceptorObject?.responseOnSuccessHandler
        )
      )
      .catch((err) =>
        this.handleFetchError(
          err,
          this.interceptorObject?.requestOnFailHandler,
          this.interceptorObject?.responseOnFailHandler
        )
      );
  }

  async put<T>(
    url: string,
    data: RequestBodyType | null,
    headerOptions?: NextCustomHeaderConfig
  ): Promise<T> {
    // fetch가 일어나기 전에 먼저 실행
    const updatedHeaderOptions = this.interceptorObject?.beforeRequestHandler?.(
      headerOptions || {}
    );
    return fetch(`${this.baseUrl}${url}`, {
      method: "put",
      body: JSON.stringify(data),
      ...this.defaultHeader,
      ...updatedHeaderOptions,
    })
      .then((res) =>
        this.handleAfterFetch(
          res,
          this.interceptorObject?.responseOnSuccessHandler
        )
      )
      .catch((err) =>
        this.handleFetchError(
          err,
          this.interceptorObject?.requestOnFailHandler,
          this.interceptorObject?.responseOnFailHandler
        )
      );
  }

  async patch<T>(
    url: string,
    data: RequestBodyType | null,
    headerOptions?: NextCustomHeaderConfig
  ): Promise<T> {
    // fetch가 일어나기 전에 먼저 실행
    const updatedHeaderOptions = this.interceptorObject?.beforeRequestHandler?.(
      headerOptions || {}
    );
    return fetch(`${this.baseUrl}${url}`, {
      method: "patch",
      body: JSON.stringify(data),
      ...this.defaultHeader,
      ...updatedHeaderOptions,
    })
      .then((res) =>
        this.handleAfterFetch(
          res,
          this.interceptorObject?.responseOnSuccessHandler
        )
      )
      .catch((err) =>
        this.handleFetchError(
          err,
          this.interceptorObject?.requestOnFailHandler,
          this.interceptorObject?.responseOnFailHandler
        )
      );
  }

  async delete<T>(
    url: string,
    headerOptions?: NextCustomHeaderConfig
  ): Promise<T> {
    // fetch가 일어나기 전에 먼저 실행
    const updatedHeaderOptions = this.interceptorObject?.beforeRequestHandler?.(
      headerOptions || {}
    );
    return fetch(`${this.baseUrl}${url}`, {
      method: "delete",
      ...this.defaultHeader,
      ...updatedHeaderOptions,
    })
      .then((res) =>
        this.handleAfterFetch(
          res,
          this.interceptorObject?.responseOnSuccessHandler
        )
      )
      .catch((err) =>
        this.handleFetchError(
          err,
          this.interceptorObject?.requestOnFailHandler,
          this.interceptorObject?.responseOnFailHandler
        )
      );
  }
}
