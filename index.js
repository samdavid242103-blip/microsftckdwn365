const msal = require("@azure/msal-node");
const fs = require("fs");

const clientId = process.env.MICROSOFT_CLIENT_ID;
const tenantId = process.env.MICROSOFT_TENANT_ID;

if (!clientId || !tenantId) {
  console.error("Missing MICROSOFT_CLIENT_ID or MICROSOFT_TENANT_ID");
  process.exit(1);
}

const app = new msal.PublicClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
  },
});

const request = {
  scopes: ["User.Read"],
  deviceCodeCallback: (response) => {
    console.log("\n==============================");
    console.log("MICROSOFT DEVICE LOGIN");
    console.log("==============================");
    console.log("\nCode:", response.userCode);
    console.log("\nVerification URL:", response.verificationUri);
    console.log("\n", response.message);
  },
};

app.acquireTokenByDeviceCode(request)
  .then((result) => {
    console.log("\nAuthentication completed.");
    console.log("Signed-in account:", result.account?.username);
    
    // Save full response to auth_response.json
    const outputPath = "./auth_response.json";
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Full authentication response saved to ${outputPath}`);
  })
  .catch((error) => {
    console.error("\nAuthentication failed:");
    console.error(error);
  });
