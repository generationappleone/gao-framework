import { GaoRequest } from '@gao/http';

export class MockRequestBuilder {
    private method = 'GET';
    private url = 'http://localhost';
    private headers = new Headers();
    private _body: any = null;
    private _params: Record<string, string> = {};
    private _user: any = null;
    private _ip = '127.0.0.1';

    constructor(path = '/') {
        this.url = `http://localhost${path.startsWith('/') ? path : '/' + path}`;
    }

    get(path: string) {
        this.method = 'GET';
        this.url = `http://localhost${path}`;
        return this;
    }

    post(path: string) {
        this.method = 'POST';
        this.url = `http://localhost${path}`;
        return this;
    }

    put(path: string) {
        this.method = 'PUT';
        this.url = `http://localhost${path}`;
        return this;
    }

    delete(path: string) {
        this.method = 'DELETE';
        this.url = `http://localhost${path}`;
        return this;
    }

    patch(path: string) {
        this.method = 'PATCH';
        this.url = `http://localhost${path}`;
        return this;
    }

    withAuth(token: string) {
        this.headers.set('Authorization', `Bearer ${token}`);
        return this;
    }

    withHeader(key: string, value: string) {
        this.headers.set(key, value);
        return this;
    }

    withBody(body: any) {
        this._body = body;
        if (!this.headers.has('Content-Type')) {
            this.headers.set('Content-Type', 'application/json');
        }
        return this;
    }

    withParams(params: Record<string, string>) {
        this._params = params;
        return this;
    }

    withUser(user: any) {
        this._user = user;
        return this;
    }

    withIp(ip: string) {
        this._ip = ip;
        return this;
    }

    buildNative(): Request {
        let bodyInit: BodyInit | null = null;

        if (this._body) {
            if (typeof this._body === 'string') {
                bodyInit = this._body;
            } else if (this._body instanceof FormData) {
                bodyInit = this._body;
                // Don't set content-type for FormData, let fetch/Request handle it
                this.headers.delete('Content-Type');
            } else {
                bodyInit = JSON.stringify(this._body);
            }
        }

        return new Request(this.url, {
            method: this.method,
            headers: this.headers,
            body: this.method !== 'GET' && this.method !== 'HEAD' ? bodyInit : undefined,
        });
    }

    build(): GaoRequest {
        const nativeReq = this.buildNative();
        const req = new GaoRequest(nativeReq, this._ip);

        // Inject custom params/user for controller testing
        if (Object.keys(this._params).length > 0) {
            req.params = this._params;
        }

        if (this._user) {
            req.user = this._user;
        }

        // Inject body directly to skip parsing in simple unit tests,
        // though for integration tests parseBody() will be called by middleware
        if (this._body) {
            req.body = this._body;
        }

        return req;
    }
}

export function request(path = '/') {
    return new MockRequestBuilder(path);
}
