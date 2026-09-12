import PocketBase from 'pocketbase';

export const pb = new PocketBase('http://192.168.47.147:8090');

// Disable auto cancellation of requests if desired or keep default
pb.autoCancellation(false);

export default pb;
