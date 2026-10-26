import { _electron as electron } from '@playwright/test';
import electronPath from 'electron';
import {mkdtemp,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(path.join(tmpdir(),'neuratrack-desktop-test-'));
const desktop=await electron.launch({executablePath:electronPath,args:['desktop/main.cjs'],env:{...process.env,NEURATRACK_TEST_DATA:profile},timeout:30000});
try{
  const page=await desktop.firstWindow();
  await page.getByRole('heading',{name:'See movement more clearly.'}).waitFor();
  assert.equal(new URL(page.url()).protocol,'neuratrack:');
  assert.equal(await page.evaluate(()=>window.innerWidth),430);
  assert.equal(await page.evaluate(()=>typeof window.require),'undefined');
  await page.waitForFunction(()=>{const v=document.querySelector('.landing-video');return v?.loop&&v.readyState>=2&&v.currentTime>0;});
  const video=await page.locator('.landing-video').boundingBox();assert.ok(video.y<900);
  await mkdir('test-results/desktop',{recursive:true});
  await page.screenshot({path:'test-results/desktop/home.png'});
  await page.goto('neuratrack://app/consent');
  await page.getByRole('link',{name:'Back to NeuraTrack home',exact:false}).click();
  await page.getByRole('heading',{name:'See movement more clearly.'}).waitFor();
  await page.goto('neuratrack://app/demo');
  await page.getByRole('heading',{name:'A repeating rhythm stood out.'}).waitFor();
  await page.getByRole('tab',{name:'Signal evidence'}).click();
  await page.getByText('Recording integrity',{exact:true}).waitFor();
  await page.goto('neuratrack://app/consent');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('Display name').fill('Desktop test');await page.getByRole('button',{name:/continue/i}).click();
  await page.goto('neuratrack://app/capture/rest');
  // Only the camera source is synthetic; exercise the real downloaded model.
  await page.evaluate(()=>{
    navigator.mediaDevices.getUserMedia=async()=>{
      const c=document.createElement('canvas');c.width=640;c.height=480;
      const timer=setInterval(()=>{c.getContext('2d').fillRect(0,0,640,480);},33);
      const stream=c.captureStream(30);for(const t of stream.getTracks()){const stop=t.stop.bind(t);t.stop=()=>{clearInterval(timer);stop();};}return stream;
    };
  });
  await page.getByRole('button',{name:'Enable camera'}).click();
  await page.getByRole('button',{name:'Turn camera off'}).waitFor({timeout:60000});
  await page.getByText('HAND NOT VISIBLE',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Turn camera off'}).click();
  console.log('Desktop smoke passed: native window, 430px layout, local routes, looping DNA, isolated renderer, analysis, real tracking runtime with synthetic blank camera.');
}finally{await desktop.close();}
