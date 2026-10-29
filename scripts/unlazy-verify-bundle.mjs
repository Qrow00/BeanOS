const url =
  'http://127.0.0.1:8081/node_modules/expo-router/entry.bundle' +
  '?platform=android&dev=true&hot=false&lazy=true' +
  '&transform.engine=hermes&transform.routerRoot=app' +
  '&unstable_transformProfile=hermes-stable';

const response = await fetch(url);

if (!response.ok) {
  console.error(`bundle request failed with status ${response.status}`);
  process.exit(1);
}

const body = await response.text();

if (body.length < 1_000_000) {
  console.error(`bundle too small: ${body.length} bytes`);
  process.exit(1);
}

console.log(`bundle passed (${body.length} bytes)`);
