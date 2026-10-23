import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/e2e', timeout:45000, expect:{timeout:8000}, fullyParallel:true, workers:2,
  retries:0, reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://127.0.0.1:5193',trace:'retain-on-failure',screenshot:'only-on-failure'},
  projects:[
    {name:'chromium',use:{...devices['Desktop Chrome']}},
    {name:'mobile',use:{...devices['Pixel 7']}},
    {name:'webkit',use:{...devices['Desktop Safari']}},
    {name:'firefox',use:{...devices['Desktop Firefox']}},
  ],
  webServer:[
    {command:'npm run dev -- --host 127.0.0.1 --port 5193 --strictPort',url:'http://127.0.0.1:5193',reuseExistingServer:false},
    {command:'npm run build && npm run preview -- --host 127.0.0.1 --port 4193 --strictPort',url:'http://127.0.0.1:4193',reuseExistingServer:false,timeout:60000},
  ],
});
