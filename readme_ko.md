# Kofetch 🚀

> Implement updated fetch api for using Next.js

## Github

내부 코드를 보고 싶으시다면, 해당 주소로 접속해 주세요! `core.ts` 파일이 메인 로직입니다.  
https://github.com/kokyusik91/kofetch

## Prerequisites

해당 프로젝트는 노드 버전 20.4.0에서 만들어 졌습니다.
[Node](http://nodejs.org/), [NPM](https://npmjs.org/)에서 노드를 설치해 주세요.

```sh
$ npm -v && node -v
v20.4.0
```

## Installation

npm을 사용한다면 다음 명령어를 실행해 주세요.

```sh
$ npm install -i kofetch
```

yarn을 사용한다면 다음 명령어를 실행해 주세요.

```sh
$ yarn add kofetch
```

## Concept

보통 데이터를 페칭하는데 많이 사용되는 [axios](https://axios-http.com/kr/docs/instance) 라이브러리와 비슷하게 사용가능하도록 개발 하였습니다.

## Usage

### 1. Kofetch 인스턴스를 만들어주세요.

```typescript
// 아무 옵션을 넘기지 않아도 사용가능합니다!
const fetchInstance = Kofetch.create({});
```

create 메서드의 인자로 넘길 수 있는 프로퍼티 객체 `Options` 입니다.  
하단에는 주요 프로퍼티들의 타입 입니다.

1. `baseUrl` : 기본이 되는 url 입니다. `(optional)`

| Type   | Default value |
| ------ | ------------- |
| string | ''            |

2. `config` : 여러가지 config 들이 포함됩니다. `(optional)`
   - RequestInit : 요청을 보낼때 포함 시킬 수 있는 메타 정보들 (`headers`, `body`, `cache`, etc )
   - interceptor : 인터 셉터 함수들로 이루어진 객체입니다.
   - next.js revalidate 옵션 : next.js에서 제공하는 `revalidate` 옵션이 포함됩니다.

| Type                   | Default value |
| ---------------------- | ------------- |
| NextCustomHeaderConfig | {}            |

#### 옵션 적용 ✅

예시) 여러가지 config 옵션들을 넣는 예시입니다. (아래 예시 참고시 next.js에서 제공하는 [revalidate](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#time-based-revalidation) 객체도 넣을 수 있습니다. )

```typescript
const fetchInstance = Kofetch.create({
  baseUrl: '',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  cache: 'force-cache',
  next: { revalidate: 30 },
  // 인터셉터 객체
  interceptor: {
    beforeRequestHandler: beforereq,
    requestOnFailHandler: requestFail,
    responseOnSuccessHandler: handleResponseSuccess,
    responseOnFailHandler: handleResponseError,
  },
});
```

### 2. 인스턴스를 생성했다면, 이제 http 메서드 기반으로 요청을 보낼 수 있습니다.

예시) 기본적인 `get` 요청입니다.

1. `제네릭`으로 응답받을 형태의 데이터 타입을 넘겨줄 수 있습니다.

2. 추가적으로 개별 요청마다 `config`값 들을 넘길 수 있습니다. (대신에 config는 세번째 인자이기 때문에, get요청의 params 이나, post 요청의 requset body, 가 없다면, 빈 객체로 2번째 인자를 채워줘야합니다 🥲)

3. 응답 받은 데이터는 내부에서 `.json()`로 **객체화** 되기 때문에 반환되는 response에 별도의 처리를 안해줘도 됩니다.

```typescript
try {
  const response = await fetchInstance.get<TODO>(
    'https://jsonplaceholder.typicode.com/todos/1',
    // params가 들어올 자리
    {},
    // 추가 config 옵션 객체
    { next: { revalidate: 3000 } }
  );
  console.log(response);
} catch (error) {
  console.log('네트워크 요청 실패 에러', error);
}
```

### 3. get 요청

- get 요청의 경우 데이터는 `쿼리 스트링` 형태로 전달됩니다. 하지만 직접 `query-string`형태로 넘길필요없이, 백엔드에 전달할 데이터를 객체형태로 넘겨주면 내부에서 `query-string`으로 변환되 요청시 endpoint 뒤에 부착됩니다. (원하신다면 params객체를 넘기지 말고, 직접 endpoint에 직접 `query-string`을 명시하셔도 됩니다!)

```typescript
// get 요청에 사용되는 쿼리 파라미터 => 내부에서 ?gender=male&height=186 으로 변경됨
const queryParams = {
  gender: "male",
  height: 186,
};

try {
  const response = await fetchInstance.get<TODO>(
    "https://jsonplaceholder.typicode.com/todos/1",
    params : queryParams
  );
  console.log(response);
} catch (error) {
  console.log("네트워크 요청 실패 에러", error);
}
```

### 4. post, put, patch 요청

- post, put, patch의 경우 데이터는 JSON 객체로 전달됩니다. 2번째 인자로 백엔드에 넘길 데이터를 넘겨주면 됩니다. 내부에서 `JSON.stringify()`로 직렬화 시키기 때문에 별도 처리를 안해줘도 됩니다.

```typescript
// post 요청에 사용되는 request body
const requstBody = {
  age: 28,
  like: false,
};

try {
  const response = await fetchInstance.get<TODO>(
    "https://jsonplaceholder.typicode.com/todos/1",
    data : requstBody
  );
  console.log(response);
} catch (error) {
  console.log("네트워크 요청 실패 에러", error);
}
```

### 5. delete 요청

- delete 요청은 대게 ` path parameter`로 데이터를 전달하므로, 추가 request body를 받지는 않습니다.

### 6. 인터셉터 (중요! 🚨)

- axios에는 기본적으로 api interceptor가 기본적으로 구현이 되어있지만, fetch api는 해당 기능이 없습니다. 하지만 fetch를 한번 wrapping한 `kofetch`내부에는 interceptor가 내장되어있습니다.
- axios에서와 마찬가지로 총 4가지 시점의 `interceptor handler`가 구성됩니다.
  1. 요청 직전 수행하는 함수 `beforeRequestHandler`
  2. 요청 실패시 수행되는 함수 `requestOnFailHandler` (주로 네트워크 에러시 실행됨)
  3. 응답 성공시 수행되는 함수 `responseOnSuccessHandler`
  4. 응답 실패시 수행되는 함수 `responseOnFailHandler`
- 각 함수의 실행 시점은 `kofetch` 내부에서 수행됩니다.  
  사용자는 해당 함수의 실행 시점에 신경쓸 필요없이, **해당 시점에 수행하고 싶은 콜백함수만 선언**하고 넘기면 됩니다.
- 인터셉터는 `옵셔널`이기 때문에 넣지 않아도 동작하는데 문제가 없습니다.
- 추가로 요청전에 실행되는 함수인 `beforeRequestHandler`에서 직접 config를 조작할 수 있습니다. 예를들어 request header의 Authorization에 token을 삽입하는, 등을 실행 할 수 있습니다. 요청 전에 실행하고, 그다음에 fetch 함수가 실행됩니다.

### 6-1. 인터셉터 사용방법

```typescript
// 각 시점에 사용될 콜백 함수를 선언합니다.
const beforereq = (config: NextCustomHeaderConfig) => {
  console.log('요청전 인터셉터 핸들러 실행!');
  return config;
};

const requestFail = (error: any) => {
  console.log('요청 실패 했을때 인터셉터 핸들러 실행!');
  return Promise.reject(error);
};

const responsefail = (error: any) => {
  console.log('응답 실패 했을때 인터셉터 핸들러 실행!');
  return Promise.reject(error);
};

const responseSuccess = (res: Promise<any>) => {
  console.log('응답 성공했을때 인터셉터 핸들러 실행!');
  return res;
};

// interceptor 사용예시
const fetchInstance = Kofetch.create({
  baseUrl: '',
  interceptor: {
    beforeRequestHandler: beforereq,
    requestOnFailHandler: requestFail,
    responseOnSuccessHandler: responseSuccess,
    responseOnFailHandler: responsefail,
  },
});
```

### 7. 응답 실패 에러 객체

axios에서는 HTTP요청의 응답이 실패했을때, `AxiosError`타입의 객체를 자체적으로 생성하여, 응답 에러객체를 던집니다. 이와 마찬가지로 koFetch에서는 현재 내부에서 자체적으로 에러 dto객체를 생성하였습니다. 현재 구성되있는 `에러 dto 객체`는 다음과 같습니다. (에러 객체 내부는 추후 고도화 예정입니다 😅)

```typescript
{
  stausCode, // 에러 statusCode
  name, // 에러 이름
  responseDto, // 백엔드의 에러 응답 객체
  requestUrl, // 요청 url
  requestheaders, // 요청시 포함된 header
  message, // 에러 메시지
}

```

현재는 `Kofetch` 인스턴스를 생성할때 인터셉터 객체 안에 각 시점에 맞는 함수들을 넣어 주기만 하면됩니다. 개별 요청마다 인터셉터를 추가하는 기능은 추후 개발될 예정입니다. 만약 지금 당장 여러 인터셉터가 필요한 상황이라면, 새로운 Kofetch 인스턴스를 만들고, 그 인스턴스를 사용해주세요!

### 8. 정리

현재 필수 기능들만 추가하여 진행한 상태입니다. 아직은 불안정하니 사용은 지양 🫠해주세요!
현재 기준으로 가능한 기능들 입니다.

#### 현재 개발된 기능 🔨

- [x] 기본적인 http 요청 응답 가능 (get, post, put, patch, delete) ✅
- [x] 최초, fetch instance 만들때 부터 config(header, interceptor, cache 등등) 삽입 할 수 있어야함. ✅
- [x] 각 요청마다 사용자가 필요할때 config 넣을 수 있게 만듬. ✅
- [x] response type 제네릭으로 넘길 수 있음.
- [x] 요청 보낼때, json stringify, 응답받을때 json Parse 처리. ✅
- [x] config에 next에서 제공하는 revalidate 프로퍼티를 넘길 수 있게 만듬. ✅
- [x] interceptor 총 4가지 시점 핸들링 (요청전, 요청실패, 응답성공, 응답실패) ✅
- [x] axios 처럼, 요청객체를 가져올 수 있어야한다 ✅

#### 추가 예정 기능 🔥

- [ ] 에러 타입 개선 (내부)
- [ ] 인터셉터를 각 요청마다 직접 컨트롤 할 수 있도록 만들어야함.
- [ ] refresh token 로직 대응되는지 확인

### 9. 1.0.5 버전 패치

- kofetch 내부의 type들을 별도의 `type.ts`파일로 분리하였습니다.
- kofetch 내부에 사용된 모든 타입들은 kofetch 패키지에 포함되어져 있으므로, import 해서 사용하면 됩니다.
