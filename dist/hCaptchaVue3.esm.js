import { toRefs, h } from 'vue';

var script = {
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
    setup: function setup(props, context) {
        var theProps = toRefs(props);
        var hcaptchaInstanceId = null;

        function apiLoadError(event) {
            document.querySelector('#hCaptchaVue3Comp p').style = 'display: block';
            console.error('api load error', event);
        }
        function apiLoaded() {
            if (window.hcaptcha) {
                var container = document.getElementById('hCaptchaVue3Comp');
                var captchaEl = document.createElement('div');
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
            var key = window.hcaptcha.getResponse(hcaptchaInstanceId);
            var eKey = window.hcaptcha.getRespKey(hcaptchaInstanceId);
            if (!theProps.veryifyEndpoint.value.length) { return context.emit('verified', { key: key, eKey: eKey }); }
            //run fetch
            var frmData = new FormData();
            var rqstParams = {
                method: 'post',
                body: frmData,
                cache: 'no-cache',
            };
            if (theProps.inclCredentials.value) { rqstParams.credentials = 'include'; }
            frmData.append('key', key);
            frmData.append('eKey', eKey);
            fetch(theProps.veryifyEndpoint.value, rqstParams)
                .then(function (response) {
                    context.emit('serverResponse', {
                        status: response.status,
                        respObj: response,
                    });
                })
                .catch(function (err) {
                    context.emit('serverResponse', {
                        status: 'error',
                        respObj: err,
                    });
                });
        }

        var scriptEl = h('script', {
            async: true,
            defer: true,
            onLoad: function () { return apiLoaded(); },
            onError: function (event) { return apiLoadError(event); },
            src: theProps.apiUrl.value,
        });
        var errorEl = h(
            'p',
            {
                style: 'display: none',
            },
            'hCaptcha API Failed'
        );

        if (!window.hcaptcha && !document.getElementById('hCaptchaVue3Comp')) {
            return function () { return h(
                    'div',
                    {
                        id: 'hCaptchaVue3Comp',
                    },
                    scriptEl,
                    errorEl
                ); };
        } else {
            return function () { return h('div', ''); };
        }
    },
};

script.__file = "src/hCaptchaVue3.vue";

export { script as default };
