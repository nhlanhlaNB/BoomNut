const FIREBASE_DB_URL = "https://tutapp-88bf0-default-rtdb.firebaseio.com";

async function run() {
  const userId = "frCXQoh0quW5ehd8tkQsFemq0Nn2";
  // Trying both with and without quotes for the query keys/values
  const url1 = `${FIREBASE_DB_URL}/subscriptions.json?orderBy="userId"&equalTo="${userId}"`;
  
  console.log("Fetching query:", url1);
  const res1 = await fetch(url1);
  const data1 = await res1.json();
  console.log("Data:", JSON.stringify(data1, null, 2));
}

run();
