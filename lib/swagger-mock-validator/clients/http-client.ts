import * as request from 'request';

const hasHttp2xxStatusCode = (response: request.RequestResponse) =>
    response.statusCode && response.statusCode >= 200 && response.statusCode <= 299;

export class HttpClient {
    public get(url: string): Promise<string> {
        const requestOptions = {
            timeout: 30000,
            url
        };

        return new Promise((resolve, reject) => {
            request(requestOptions, (error, response, body) => {
                if (error) {
                    reject(error);
                } else if (response.statusCode !== 200) {
                    reject(new Error(`Expected 200 but received ${response.statusCode}`));
                } else {
                    resolve(body);
                }
            });
        });
    }

    public post(url: string, body: any): Promise<void> {
        const requestOptions = {
            body,
            json: true,
            method: 'POST',
            timeout: 5000,
            url
        };

        return new Promise<void>((resolve, reject) => {
            request(requestOptions, (error, response) => {
                if (error) {
                    reject(error);
                } else if (!hasHttp2xxStatusCode(response)) {
                    reject(new Error(`Expected 2xx but received ${response.statusCode}}`));
                } else {
                    resolve();
                }
            });
        });
    }
}
