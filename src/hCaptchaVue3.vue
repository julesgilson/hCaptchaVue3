<script>
/**
 * Enterprise Attributes not supported
 * Single instance of component per page only
 * Verified event returns object {key,eKey} - other events return event
 */

import { h, toRefs } from 'vue';

export default {
    props: {
        sitekey: { default: '10000000-ffff-ffff-ffff-000000000001', type: String, required: true },
        size: { default: 'normal', type: String },
        theme: { default: 'light', type: String },
        tabindex: { default: '0', type: String },
        apiUrl: { default: 'https://js.hcaptcha.com/1/api.js?render=onload&recaptchacompat=off', type: String },
        veryifyEndpoint: { default: '', type: String },
        inclCredentials: { default: false, type: Boolean },
    },
    emits: ['error', 'verified', 'expired', 'challengeExpired', 'opened', 'closed', 'reset', 'rendered', 'executed', 'serverResponse'],
    setup(props, context) {
        const theProps = toRefs(props);
        let hcaptchaInstanceId = null;

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

        function respexpired(resp) {
            context.emit('expired', resp);
        }
        function respchalexpired(resp) {
            context.emit('challengeexpired', resp);
        }
        function respopened(resp) {
            context.emit('opened', resp);
        }
        function respclosed(resp) {
            context.emit('closed', resp);
        }
        function resperror(resp) {
            context.emit('error', resp);
        }

        function captchaVerified() {
            const key = window.hcaptcha.getResponse(hcaptchaInstanceId);
            const eKey = window.hcaptcha.getRespKey(hcaptchaInstanceId);
            if (!theProps.veryifyEndpoint.value.length) return context.emit('verified', { key: key, eKey: eKey });
            //run fetch
            const frmData = new FormData();
            const rqstParams = {
                method: 'post',
                body: frmData,
                cache: 'no-cache',
            };
            if (theProps.inclCredentials.value) rqstParams.credentials = 'include';
            frmData.append('key', key);
            frmData.append('eKey', eKey);
            fetch(theProps.veryifyEndpoint.value, rqstParams)
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

        const scriptEl = h('script', {
            async: true,
            defer: true,
            onLoad: () => apiLoaded(),
            onError: (event) => apiLoadError(event),
            src: theProps.apiUrl.value,
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
