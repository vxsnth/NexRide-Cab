import { io } from 'socket.io-client';
import { NGROK_URL } from '../config';
export const socket = io(NGROK_URL,{
transports: ['websocket'],
autoConnect: true,
});