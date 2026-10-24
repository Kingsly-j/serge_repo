export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const source = `importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");\nimportScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");\nfirebase.initializeApp(${JSON.stringify(config)});\nconst messaging=firebase.messaging();\nmessaging.onBackgroundMessage((payload)=>{const title=payload.notification?.title||"Anthony Mobile Homes";self.registration.showNotification(title,{body:payload.notification?.body||"You have a new message.",icon:"/anthony-mark.svg",data:payload.data||{}})});\nself.addEventListener("notificationclick",(event)=>{event.notification.close();const url=event.notification.data?.url||"/account";event.waitUntil(clients.openWindow(url))});`;
  return new Response(source, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-cache, no-store, must-revalidate", "Service-Worker-Allowed": "/" } });
}
