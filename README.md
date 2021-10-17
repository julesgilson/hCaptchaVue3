# hCaptchaVue3 - Vue 3 hCaptcha Component 

 A Vue 3 SFC component to add a [hCaptcha](https://www.hcaptcha.com/) user validation widget.

- For use in Vue 3 Projects
- All configuration passed in with props, including size, theme, tab index and dark mode
- All hCaptcha events emitted for handling in parent component
- **Optional custom endpoint server validation**
- Enterprise options (rqdata, sentry etc.) not currently supported

*This package created for internal use, feel free to use but support will be limited*

## Install
```bash
npm install hcaptchavue3
```
**Dependencies**

- vue ^3.0.0
	

## Usage

> To include in existing Vue 3 Project

1. Import and declare in the parent component
    ```js
    import hcaptchavue3 from "hcaptchavue3";
    ...
    export default {
        components: {
            hcaptchavue3,
        },
         ...
    }
    ```
2. Add to the template, with your site key (defaults to test key)
    ```html
    <template>
        ...
            <hcaptchavue3
                          @verified="handleVerification($event)"
                          sitekey="10000000-ffff-ffff-ffff-000000000001">
            </hcaptchavue3>
        ...
    </template>
    ```
    
3. Include methods for any emitted event handling
    ```js
    ...
    setup() {
    	...
        const handleVerification = ref((payload) => {
        	console.log(payload);
         });
        ...
         return { handleVerification };
        },
    ```

## Config

#### Props

See hCaptcha docs for valid values of the configuration options. (The data- prefix is not required)

https://docs.hcaptcha.com/configuration#hcaptcha-container-configuration

|Prop Name|Type|Required|Default|
|---|---|---|---|
|`sitekey`|String|**Yes**|`10000000-ffff-ffff-ffff-000000000001`|
|`size`|String|No|`normal`|
|`theme`|String|No|`light`|
|`tabindex`|String|No|`0`|
| `apiurl`          | String  | No       | `https://js.hcaptcha.com/1/api.js`     |
| `validateendpoint` | String  | No       | <empty>                                |
| `inclcredentials` | Boolean | No       | False                                  |

- `apiurl` is currently the correct endpoint for hCaptcha. If changed, the final URL used will have the following options appended:
	- `render`:`explicit`
	- `recaptchacompat`:`off`
- `validateendpoint` should be omitted if it is not required for the component to confirm response token with a server endpoint. Adding a value for `validateendpoint` will trigger the component to attempt server validation. See below.

#### Emitted Events

Other than the `verified` and `serverResponse` events, the events are emitted by the hCapctha API

|Event|Payload|Trigger|
|---|---|---|
|`verified`|`Object: {token: String, eKey: String}`|hCaptcha completed successfully by user|
|`error`|`"error":String`|See "data-error-callback" in [hCaptcha docs](https://docs.hcaptcha.com/configuration#hcaptcha-container-configuration)|
|`expired`|`"expired":String`|See "data-expired-callback" in [hCaptcha docs](https://docs.hcaptcha.com/configuration#hcaptcha-container-configuration)|
|`challengeExpired`|`"chalexpired":String`|See "data-chalexpired-callback" in [hCaptcha docs](https://docs.hcaptcha.com/configuration#hcaptcha-container-configuration)|
|`opened`|`"opened":String`|See "data-open-callback" in [hCaptcha docs](https://docs.hcaptcha.com/configuration#hcaptcha-container-configuration)|
|`closed`|`"closed":String`|See "data-close-callback" in [hCaptcha docs](https://docs.hcaptcha.com/configuration#hcaptcha-container-configuration)|
| `serverResponse`   | `Object: {status: Int \| String, Response: Object}` | Validation endpoint fetch completed                    |



## Server Validation

As the hCaptcha secret key is required to validate the key returned from on-page verification, this validation should take place server side. The component can complete the additional step of calling this server side script and return its response. The script that performs the server-side validation is not covered by this package.

#### Configuration

If the `validateendpoint` prop is passed with an URL value, the component will make a POST Fetch request to that URL after the user has successfully completed the on-page verification. The `verified` event will still fire directly after on-page verification.

```html
<template>
    ...
        <hcaptchavue3
                      ...
                      validateendpoint="https://xyz.com/validate">
        </hcaptchavue3>
    ...
</template>
```

Optionally, a prop `inclcredentials` can be added, if required:

```html
<template>
    ...
        <hcaptchavue3
                      ...
                      validateendpoint="https://xyz.com/validate"
                      :inclcredentials=true>
        </hcaptchavue3>
    ...
</template>
```

If it is required to post additional fields to the server, `input` elements can be added in the default slot.

<u>Note: Only `input` fields of type `hidden` are passed</u>

```html
<template>
    ...
        <hcaptchavue3 ...>
            <input type="hidden" name="extra" value="xyz">
        </hcaptchavue3>
    ...
</template>
```

#### Request

After on-page verification is completed, the POST request will be made to the endpoint specified in `validateendpoint`, passing the following fields as form data

| Input Field Name | Value Characterisation                                       |
| ---------------- | ------------------------------------------------------------ |
| `key`            | The key returned by the hCaptcha API after on-page verification |
| `eKey`           | The ekey retuend by the hCaptcha API after on-page verification |

If `input` fields of type `hidden` were found in the default slot, they will also be posted as form fields with the name and values as defined in the slot.

#### Response

Upon receiving the response from the server endpoint, the `serverResponse` event will be emitted by the component

| Event            | Payload                                            | Trigger                             |
| ---------------- | -------------------------------------------------- | ----------------------------------- |
| `serverResponse` | `Object: {status: Int \| String, Response: Object}` | Validation endpoint fetch completed |

- `status` - If there was an error during Fetch this will be the string "error". Otherwise it will be the `status` property of the response object. Generally if the validation endpoint returns status 200 on success, this is all that needs to be checked
- `Response` - This will be the complete response object, as returned from the endpoint
