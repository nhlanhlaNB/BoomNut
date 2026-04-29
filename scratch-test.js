const FIREBASE_DB_URL = "https://tutapp-88bf0-default-rtdb.firebaseio.com";

async function test() {
  const referrerId = 'ZfWt2959N2O1QdQFFoN1s4dYdFN2';
  const referrerUrl = `${FIREBASE_DB_URL}/affiliates/${referrerId}.json`;
  const referrerResponse = await fetch(referrerUrl);
  const referrerData = await referrerResponse.json();
  console.log("referrerData:", referrerData);
}
test();
