import axios, {AxiosRequestHeaders} from 'axios';

export class HttpClient {
    public async get(url: string, auth?: string): Promise<string> {
        const headers: AxiosRequestHeaders = auth
            ? {authorization: 'Basic ' + Buffer.from(auth).toString('base64')}
            : {}
        const response = await axios.get(url, {
            headers,
            timeout: 30000,
            transformResponse: (data) => data,
            validateStatus: (status) => status === 200
        });
        return response.data;
    }

    public async post(url: string, body: any): Promise<void> {
        await axios.post(url, body, {
            timeout: 5000,
            validateStatus: (status) => status >= 200 && status <= 299
        });
    }
}
