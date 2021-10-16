<script>
/**
 * Enterprise Attributes not supported
 * Single instance of component per page only
 * Verified event returns object {key,eKey}
 * serverResponse returns object {status,ResponseObject}
 * other events return event name as string
 */

import { h, toRefs } from 'vue';

export default {
    props: {
        sitekey: { default: '10000000-ffff-ffff-ffff-000000000001', type: String, required: true },
        size: { default: 'normal', type: String },
        theme: { default: 'light', type: String },
        tabindex: { default: '0', type: String },
        apiurl: { default: 'https://js.hcaptcha.com/1/api.js', type: String },
        validateendpoint: { default: '', type: String },
        inclcredentials: { default: false, type: Boolean },
    },
    emits: ['error', 'verified', 'expired', 'challengeExpired', 'opened', 'closed', 'serverResponse'],
    setup(props, context) {
        const theProps = toRefs(props);
        let hcaptchaInstanceId = null;
        let key;
        let eKey;

        let apiAddress = theProps.apiurl.value;
        const urlParams = {
            render: 'explicit',
            recaptchacompat: 'off',
        };
        Object.keys(urlParams).forEach((key, index) => {
            apiAddress = index === 0 ? `${apiAddress}?${key}=${urlParams[key]}` : `${apiAddress}&${key}=${urlParams[key]}`;
        });

        function apiLoadError(event) {
            document.querySelector('#hCaptchaVue3Comp p').style = 'display: block';
            console.error('api load error', event);
        }
        function apiLoaded() {
            if (window.hcaptcha) {
                const container = document.getElementById('hCaptchaVue3Comp');
                const captchaEl = document.createElement('div');
                captchaEl.id = 'h-captcha';
                container.appendChild(captchaEl);
                hcaptchaInstanceId = window.hcaptcha.render('h-captcha', {
                    sitekey: theProps.sitekey.value,
                    size: theProps.size.value,
                    theme: theProps.theme.value,
                    tabindex: theProps.tabindex.value,
                    callback: captchaVerified,
                    'expired-callback': respexpired,
                    'chalexpired-callback': respchalexpired,
                    'open-callback': respopened,
                    'close-callback': respclosed,
                    'error-callback': resperror,
                });
            } else {
                document.querySelector('#hCaptchaVue3Comp p').style = 'display: block';
            }
        }

        function respexpired() {
            context.emit('expired', 'expired');
        }
        function respchalexpired() {
            context.emit('challengeexpired', 'chalexpired');
        }
        function respopened() {
            context.emit('opened', 'opened');
        }
        function respclosed() {
            context.emit('closed', 'closed');
        }
        function resperror() {
            context.emit('error', 'error');
        }

        function captchaVerified() {
            key = window.hcaptcha.getResponse(hcaptchaInstanceId);
            eKey = window.hcaptcha.getRespKey(hcaptchaInstanceId);
            context.emit('verified', { key: key, eKey: eKey });
            if (theProps.validateendpoint.value.length) {
                serverConfirm();
            }
        }

        function serverConfirm() {
            //run fetch
            const frmData = buildFormData();
            const rqstParams = {
                method: 'post',
                body: frmData,
                cache: 'no-cache',
            };
            if (theProps.inclcredentials.value) rqstParams.credentials = 'include';
            fetch(theProps.validateendpoint.value, rqstParams)
                .then((response) => {
                    context.emit('serverResponse', {
                        status: response.status,
                        respObj: response,
                    });
                })
                .catch((err) => {
                    context.emit('serverResponse', {
                        status: 'error',
                        respObj: err,
                    });
                });
        }

        function buildFormData() {
            const frmData = new FormData();
            frmData.append('key', key);
            frmData.append('eKey', eKey);
            context.slots.default().forEach((slot) => {
                if (typeof slot == 'object' && slot.type == 'input' && slot.props.type == 'hidden' && slot.props.name.length) {
                    frmData.append(slot.props.name, slot.props.value);
                }
            });
            return frmData;
        }

        const scriptEl = h('script', {
            async: true,
            defer: true,
            onLoad: () => apiLoaded(),
            onError: (event) => apiLoadError(event),
            src: apiAddress,
        });
        const errorEl = h(
            'p',
            {
                style: 'display: none',
            },
            'hCaptcha API Failed',
        );

        if (!window.hcaptcha && !document.getElementById('hCaptchaVue3Comp')) {
            return () =>
                h(
                    'div',
                    {
                        id: 'hCaptchaVue3Comp',
                    },
                    scriptEl,
                    errorEl,
                );
        } else {
            return () => h('div', '');
        }
    },
};
</script>;
