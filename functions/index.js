import { onRequest } from "firebase-functions/v2/https";
// const logger = require('firebase-functions/logger');
import admin from "firebase-admin";
// var admin = require('firebase-admin');
// const functions = require('firebase-functions');
// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started
import {MongoClient} from "mongodb";
// const {MongoClient} = require('mongodb');

import serviceAccount from'./project2-197c0-firebase-adminsdk-wgo9a-4a0448ab63.json' with { type: "json" } ;;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://project2-197c0-default-rtdb.firebaseio.com',
});

const client = new MongoClient(
  'mongodb://thuvienphapluat:ZvQn9683p8NnPXFMdR1VX53HTK3Da1WqyXJpvtgMMASTRdDkyu87lFAL7aR5DiiN@188.245.52.121:6980/?directConnection=true',
);


export const  searchLawDescription = onRequest(async (req, res) => {
  if (req.method === 'POST') {

    try {
      const database = client.db('LawMachine');
      const LawContent = database.collection('LawSearchDescription');

      LawContent.find({
        $or: [
          {_id: new RegExp(`${req.body.input}`, 'i')},
          {'info.lawDescription': new RegExp(`${req.body.input.replace(/\s/img,'\\,?\\s\\,?').replace(/\\s/img,'\.')}`, 'i')},
          {'info.lawNameDisplay': new RegExp(`${req.body.input.replace(/\s/img,'\\,?\\s\\,?').replace(/\\s/img,'\.')}`, 'i')},
        ],
      })
        .project({info: 1})
        .sort({'info.lawDaySign': -1})
        .toArray()
        .then(o => res.json(o));
    } finally {
    }
  }
});


 export const countAllLaw = onRequest(async (req, res) => {
  if (req.method === 'POST') {
    try {
      const database = client.db('LawMachine');
      const LawContent = database.collection('LawSearchDescription');

      const estimate = await LawContent.countDocuments();
      
    res.json(estimate)
    } finally {
    }
  }
});


 export const searchContent = onRequest(async (req, res) => {
  if (req.method === 'POST') {

    try {
      const database = client.db('LawMachine');
      const LawSearch = database.collection('LawSearchContent');
      LawSearch.find({fullText: new RegExp(`${req.body.input}`, 'i')})
        .project({info: 1})
        .sort({'info.lawDaySign': -1})
        .toArray()
        .then(o => res.json(o));
    } finally {
    }
  }
});

export const callOneLaw = onRequest(async (req, res) => {
  if (req.method === 'POST') {
    let a;

    try {
      const database = client.db('LawMachine');
      const LawContent = database.collection('LawCollection');
      // Query for a movie that has the title 'Back to the Future'

      a = await LawContent.findOne({_id: req.body.screen});
    } finally {
    }

    res.json(a);
  }
});


export const getlastedlaws = onRequest(async (req, res) => {
  if (req.method === 'POST') {
    try {
      const database = client.db('LawMachine');
      const LawContent = database.collection('LawSearchDescription');

      LawContent.find()
        .limit(50)
        .project({info: 1})
        .sort({'info.lawDaySign': -1})
        .toArray()
        .then(o => res.json(o));
    } finally {
    }
  }
});
