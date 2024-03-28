const express = require('express');
const { Worker  } = require('worker_threads');

const app = express();
const port = process.env.PORT || 3000;
const THREAD_COUNT = 5;

app.get('/non-blocking', (req, res) => {
  res.status(200).send('This page is non-blocking');
});


app.get('/blocking', async (req, res) => {
  let counter = 0;
  
  for (let i = 0; i < 20_000_000_000; i++) {
   counter++;
  }

  res.status(200).send(`result is ${counter}`);
});

function calculateCount() {
 return new Promise((resolve, reject) => {
   let counter = 0;
   
   for (let i = 0; i < 20_000_000_000; i++) {
     counter++;
   }

   resolve(counter);
 });
}

app.get('/blocking-promise', async (req, res) => {
  const counter = await calculateCount();
  
  res.status(200).send(`result is ${counter}`);
})

app.get('/non-blocking-single-worker', async (req, res) => {
  const worker = new Worker('./worker.js');

  worker.on('message', (data) => {
    res.status(200).send(`result is ${data}`);
  });

  worker.on('error',(msg) => {
    res.status(404).send(`An error ocurred: ${msg}`);
  });
}) 

function createWorker() {
  return new Promise(function (resolve, reject) {
    const worker = new Worker('./multiple_workers.js', {
      workerData: { thread_count: THREAD_COUNT },
    });

    worker.on('message', (data) => {
      resolve(data);
    });

    worker.on('error', (msg) => {
      reject(`An error ocurred: ${msg}`);   
    });
  });
};

app.get('/non-blocking-multiple-workers', async  (req, res) => {
  const workerPromises = [];

 for (let i = 0; i < THREAD_COUNT; i++) {
    workerPromises.push(createWorker());
 }
 
 const thread_results = await Promise.all(workerPromises);
 const total = thread_results.reduce((result, item) => result + item, 0);
  
 res.status(200).send(`result is ${total}`);
})


app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});


