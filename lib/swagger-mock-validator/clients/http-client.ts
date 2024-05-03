import axios from 'axios';

export class HttpClient {
    public async get(url: string, auth?: string): Promise<string> {
        let authHeader: string | undefined;

        if (auth) {
            if (auth.includes(':')) {
                authHeader = 'Basic ' + Buffer.from(auth).toString('base64');
            } else {
                authHeader = 'Bearer ' + auth;
            }
        }

        const response = await axios.get(url, {
            headers: {
                ...(authHeader ? { Authorization: authHeader } : {})
            },
            timeout: 30000,
            transformResponse: (data) => data,
            validateStatus: (status) => status === 200
        });
        return response.data;
    }

    public async post(url: string, body: any, auth?: string): Promise<void> {
        let authHeader: string | undefined;

        if (auth) {
            if (auth.includes(':')) {
                authHeader = 'Basic ' + Buffer.from(auth).toString('base64');
            } else {
                authHeader = 'Bearer ' + auth;
            }
        }

        await axios.post(url, body, {
            headers: {
                ...(authHeader ? { Authorization: authHeader } : {})
            },
            timeout: 5000,
            validateStatus: (status) => status >= 200 && status <= 299
        });
    }
}
