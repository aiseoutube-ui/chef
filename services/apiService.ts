
import { GOOGLE_WEB_APP_URL } from '../constants';
import type { ApiAction } from '../types';

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    [key: string]: any; // Allows for other properties like 'data' or 'status'
}

export async function callWebApp<T>(action: ApiAction, payload: object): Promise<ApiResponse<T> & T> {
    try {
        const response = await fetch(GOOGLE_WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ action, ...payload }),
            redirect: 'follow'
        });
        
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const text = await response.text();
        const result = JSON.parse(text);

        return result as ApiResponse<T> & T;

    } catch (error) {
        console.error('Error calling Google Web App:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `API Communication Error: ${errorMessage}` } as ApiResponse<T> & T;
    }
}
