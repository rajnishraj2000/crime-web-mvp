import { seedDemoData } from './src/services/seedService';
import { initDriver, closeDriver } from './src/config/neo4j';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    initDriver();
    await seedDemoData();
    console.log("Success");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await closeDriver();
  }
}
test();
