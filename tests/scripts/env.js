console.log("ENV LIST <----");
for (const env_name in process.env) {
    console.log(`- ${env_name} = ${process.env[env_name]}`);
}
console.log("ENV LIST ---->");