const FIREBASE_DB_URL = "https://tutapp-88bf0-default-rtdb.firebaseio.com";

async function run() {
  const url = `${FIREBASE_DB_URL}/subscriptions.json`;
  console.log("Fetching all subscriptions:", url);
  const res = await fetch(url);
  const data = await res.json();
  console.log("All Subs Data:", JSON.stringify(data, null, 2));
}

run();
