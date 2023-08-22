import axios from 'axios';

export class HttpClient {
    public async get(url: string): Promise<string> {
        let authHeader: string | undefined;
        if (process.env.PACT_BROKER_TOKEN != '') {
            authHeader = 'Bearer ' + process.env.PACT_BROKER_TOKEN;
        } else if (process.env.PACT_BROKER_USERNAME != '' && process.env.PACT_BROKER_PASSWORD != '') {
            authHeader =
                'Basic ' +
                Buffer.from(`${process.env.PACT_BROKER_USERNAME}:${process.env.PACT_BROKER_PASSWORD}`).toString(
                    'base64'
                );
        }

        const response = await axios.get(url, {
            headers: {
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
            timeout: 30000,
            transformResponse: (data) => data,
            validateStatus: (status) => status === 200,
        });
        return response.data;
    }

    public async post(url: string, body: any): Promise<void> {
        await axios.post(url, body, {
            timeout: 5000,
            validateStatus: (status) => status >= 200 && status <= 299,
        });
    }
}
