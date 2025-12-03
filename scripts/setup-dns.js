/**
 * Setup DNS records for synapse.shtrial.com using Namecheap API
 * 
 * This script configures:
 * - synapse.shtrial.com -> DigitalOcean App Platform (CNAME)
 * - www.synapse.shtrial.com -> synapse.shtrial.com (CNAME)
 */

const NAMECHEAP_API_KEY = 'e6f9c7b2b2dd40ecbc5497cb3182de81';
const NAMECHEAP_API_USER = 'shmindmaster'; // Your Namecheap username
const NAMECHEAP_CLIENT_IP = ''; // Will be detected

async function getPublicIP() {
  const response = await fetch('https://api.ipify.org?format=json');
  const data = await response.json();
  return data.ip;
}

async function setNamecheapDNS(clientIP) {
  const baseUrl = 'https://api.namecheap.com/xml.response';
  
  // For shtrial.com domain, we need to set host records for the 'synapse' subdomain
  // DigitalOcean App Platform requires CNAME to point to the app's default ingress
  
  const params = new URLSearchParams({
    ApiUser: NAMECHEAP_API_USER,
    ApiKey: NAMECHEAP_API_KEY,
    UserName: NAMECHEAP_API_USER,
    ClientIp: clientIP,
    Command: 'namecheap.domains.dns.setHosts',
    SLD: 'shtrial',
    TLD: 'com',
    // Host records - we need to include ALL existing records plus new ones
    // For synapse subdomain pointing to DigitalOcean App Platform
    'HostName1': 'synapse',
    'RecordType1': 'CNAME',
    'Address1': 'synapse-4wuv7.ondigitalocean.app', // Will be updated with actual app URL
    'TTL1': '1800',
    // www.synapse subdomain
    'HostName2': 'www.synapse',
    'RecordType2': 'CNAME', 
    'Address2': 'synapse.shtrial.com',
    'TTL2': '1800',
  });

  console.log('Setting DNS records...');
  console.log('URL:', `${baseUrl}?${params.toString()}`);
  
  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    const text = await response.text();
    console.log('Response:', text);
    return text;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function getNamecheapHosts(clientIP) {
  const baseUrl = 'https://api.namecheap.com/xml.response';
  
  const params = new URLSearchParams({
    ApiUser: NAMECHEAP_API_USER,
    ApiKey: NAMECHEAP_API_KEY,
    UserName: NAMECHEAP_API_USER,
    ClientIp: clientIP,
    Command: 'namecheap.domains.dns.getHosts',
    SLD: 'shtrial',
    TLD: 'com',
  });

  console.log('Getting current DNS records...');
  
  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    const text = await response.text();
    console.log('Current DNS Records:', text);
    return text;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function main() {
  console.log('🌐 Setting up DNS for synapse.shtrial.com');
  
  // Get public IP for Namecheap API
  const clientIP = await getPublicIP();
  console.log('Client IP:', clientIP);
  
  // First, get current DNS records
  await getNamecheapHosts(clientIP);
  
  // Note: To properly set DNS, we need to know the DigitalOcean app URL first
  // and include ALL existing DNS records in the setHosts call
  console.log('\n⚠️  To complete DNS setup:');
  console.log('1. Wait for DigitalOcean deployment to complete');
  console.log('2. Get the app URL from: doctl apps get <app-id> --format DefaultIngress');
  console.log('3. Update the CNAME record to point to the app URL');
}

main().catch(console.error);
