Here's the English translation of the provided text:

# Kofetch 🚀

> Implement updated fetch API for using Next.js

## Github

If you want to see the internal code, please visit this address! The `core.ts` file is the main logic.  
https://github.com/kokyusik91/kofetch

## Prerequisites

This project was created with Node version 20.4.0. Please install Node from [Node](http://nodejs.org/) and [NPM](https://npmjs.org/).

```sh
$ npm -v && node -v
v20.4.0
```

## Installation

If you are using npm, please run the following command.

```sh
$ npm install -i kofetch
```

If you are using yarn, please run the following command.

```sh
$ yarn add kofetch
```

## Concept

Developed to be used similarly to the [axios](https://axios-http.com/docs/instance) library commonly used for fetching data.

## Usage

### 1. Create a Kofetch instance.

```typescript
// You can use it without passing any options!
const fetchInstance = Kofetch.create({});
```

Here are the `Options`, the property object you can pass as an argument to the create method.  
Below are the types for the main properties.

1. `baseUrl`: The base url. `(optional)`

| Type   | Default value |
| ------ | ------------- |
| string | ''            |

2. `config`: Contains various config options. `(optional)`
   - RequestInit: Meta information that can be included when sending a request (`headers`, `body`, `cache`, etc)
   - interceptor: An object made of interceptor functions.
   - next.js revalidate option: Includes the `revalidate` option provided by next.js.

| Type                   | Default value |
| ---------------------- | ------------- |
| NextCustomHeaderConfig | {}            |

#### Applying Options ✅

Example) Various config options are included. (Refer to the example below, you can also include the [revalidate](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#time-based-revalidation) object provided by next.js.)

```typescript
const fetchInstance = Kofetch.create({
  baseUrl: "",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  cache: "force-cache",
  next: { revalidate: 30 },
  // Interceptor object
  interceptor: {
    beforeRequestHandler: beforereq,
    requestOnFailHandler: requestFail,
    responseOnSuccessHandler: handleResponseSuccess,
    responseOnFailHandler: handleResponseError,
  },
});
```

### 2. Once the instance is created, you can now send requests based on HTTP methods.

Example) A basic `get` request.

1. You can pass the data type of the response you want to receive as a `generic`.

2. You can pass additional `config` values for each individual request. (However, since config is the third argument, if there are no params for get requests or request body for post requests, you must fill the second argument with an empty object 🥲)

3. The data received in the response is **objectified** internally with `.json()`, so you don't need to process the returned response separately.

```typescript
try {
  const response = await fetchInstance.get<TODO>(
    "https://jsonplaceholder.typicode.com/todos/1",
    // Place for params
    {},
    // Additional config option object
    { next: { revalidate: 3000 } }
  );
  console.log(response);
} catch (error) {
  console.log("Network request failed error", error);
}
```

### 3. Get request

- For get requests, data is transmitted in `query string` form. However, you don't need to manually pass the `query-string`; you can pass the data you want to send to the backend in object form, and it will be converted to `query-string` and attached to the endpoint internally. (Alternatively, you can specify the `query-string` directly in the endpoint if you wish!)

```typescript
// Query parameters used for the get request => internally changed to ?gender=male&height=186
const queryParams = {
  gender: "male",
  height: 186,
};

try {
  const response = await fetchInstance.get<TODO>(
    "https://jsonplaceholder.typicode.com/todos/1",
    queryParams
  );
  console.log(response);
} catch (error) {
  console.log("Network request failed error", error);
}
```

### 4. Post, put, patch requests

- For post, put, and patch, data is transmitted as a JSON object. You can pass the data you want to send to the backend as the second argument. It's serialized internally with `JSON.stringify()`, so no separate processing is needed.

```typescript
// Request body for the post request
const requestBody = {
  age: 28,
  like: false,
};

try {
  const response = await fetchInstance.post<TODO>(
    "https://jsonplaceholder.typicode.com/todos/1",
    requestBody
  );
  console.log(response);
} catch (error) {
  console.log("Network request failed error", error);
}
```

### 5. Delete request

- Delete requests typically transmit data as `path parameters`, so no additional request body is accepted.

### 6. Interceptors (Important! 🚨)

- While axios inherently implements API interceptors, the fetch API does not have this feature. However, interceptors are built-in within the wrapped `kofetch`. 
- Like axios, there are four points of `interceptor handlers` configured:
  1. Function executed just before the request `beforeRequestHandler`
  2. Function executed when the request fails `requestOnFailHandler` (usually runs on network errors)
  3. Function executed when the response succeeds `responseOnSuccessHandler`
  4. Function executed when the response fails `responseOnFailHandler`
- The execution point of each function is carried out internally within `kofetch`.  
  Users only need to declare and pass the callback functions they want to execute at that point.
- Interceptors are `optional`, so there's no problem with operation even if they're not included.
- Additionally, in the `beforeRequestHandler` that runs before the request, you can directly manipulate the config. For example, you can insert a token into the Authorization of the request header. This is executed before the fetch function runs.

### 6-1. How to use interceptors

```typescript
// Declare the callback functions for each point.
const beforereq = (config: NextCustomHeaderConfig) => {
  console.log("Interceptor handler executed before the request!");
  return config;
};

const requestFail = (error: any) => {
  console.log("Interceptor handler executed when the request fails!");
  return Promise.reject(error);
};

const responseFail = (error: any) => {
  console.log("Interceptor handler executed when the response fails!");
  return Promise.reject(error);
};

const responseSuccess = (res: Promise<any>) => {
  console.log("Interceptor handler executed when the

 response succeeds!");
  return res;
};

// Interceptor usage example
const fetchInstance = Kofetch.create({
  baseUrl: "",
  interceptor: {
    beforeRequestHandler: beforereq,
    requestOnFailHandler: requestFail,
    responseOnSuccessHandler: responseSuccess,
    responseOnFailHandler: responseFail,
  },
});
```

### 7. Response failure error object

Like axios, which creates an `AxiosError` type object when an HTTP request response fails, koFetch currently creates its own error DTO object internally. The current `error DTO object` is as follows. (The error object will be further refined in the future 😅)

```typescript
{
  statusCode, // Error statusCode
  name, // Error name
  responseDto, // Backend error response object
  requestUrl, // Request URL
  requestHeaders, // Headers included in the request
  message, // Error message
}

```

Currently, you just need to insert the appropriate functions into the interceptor object when creating a Kofetch instance. The ability to add interceptors to each individual request will be developed in the future. If you need multiple interceptors right now, please create a new Kofetch instance and use that instance!

### 8. Summary

Currently, only essential features have been added and implemented. It is still unstable, so please avoid using it 🫠!
These are the features currently available.

#### Currently developed features 🔨

- [x] Basic HTTP request and response possible (get, post, put, patch, delete) ✅
- [x] Insert config (header, interceptor, cache, etc.) from the very start of creating the fetch instance. ✅
- [x] Allow users to insert config as needed for each request. ✅
- [x] Response type can be passed as a generic.
- [x] Handling JSON stringify when sending requests and JSON Parse when receiving responses. ✅
- [x] Inserting the revalidate property provided by next into the config. ✅
- [x] Total of 4 interception handling points (before request, request fail, response success, response fail) ✅
- [x] Being able to retrieve the request object like axios ✅

#### Additional planned features 🔥

- [ ] Improve error types (internal)
- [ ] Make interceptors directly controllable for each request.
- [ ] Check if the refresh token logic is supported

### 9. Version 1.0.5 Patch

- The types used within kofetch have been separated into a separate `type.ts` file.
- All types used within kofetch are included in the kofetch package, so you can import and use them.
