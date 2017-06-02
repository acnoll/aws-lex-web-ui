/*
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

/* global fetch Request */
/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import AWS from 'aws-sdk/global';
import LexRuntime from 'aws-sdk/clients/lexruntime';

export default class {
  constructor({
    botName,
    botAlias = '$LATEST',
    user = 'lex',
    region = 'us-east-1',
    credentials,
  }) {
    this.botName = botName;
    this.botAlias = botAlias;
    this.region = region;
    this.user = user;
    this.credentials = credentials || AWS.config.credentials;
    this.identityId = (this.credentials && 'identityId' in this.credentials) ?
      this.credentials.identityId : this.user;

    this.lexRuntime = new LexRuntime({ region, credentials: this.credentials });
  }

  refreshCreds() {
    // creds should be updated outside of the client
    this.lexRuntime.config.credentials = AWS.config.credentials;
  }

  postText(inputText, sessionAttributes = {}) {
    this.refreshCreds();
    const postTextReq = this.lexRuntime.postText({
      botAlias: this.botAlias,
      botName: this.botName,
      inputText,
      sessionAttributes,
      userId: this.identityId, // TODO may want to switch this to this.user
    });

    return postTextReq.promise();
  }

  postContent(blob, sessionAttributes = {}, acceptFormat = 'audio/ogg', offset = 0) {
    const mediaType = blob.type;
    let contentType = mediaType;
    this.refreshCreds();

    if (mediaType.startsWith('audio/wav')) {
      contentType = 'audio/x-l16; sample-rate=16000; channel-count=1';
    } else if (mediaType.startsWith('audio/ogg')) {
      contentType =
      'audio/x-cbr-opus-with-preamble; bit-rate=32000;' +
        ` frame-size-milliseconds=20; preamble-size=${offset}`;
    } else {
      console.warn('unknown media type in lex client');
    }

    const postContentReq = this.lexRuntime.postContent({
      accept: acceptFormat,
      botAlias: this.botAlias,
      botName: this.botName,
      contentType,
      inputStream: blob,
      sessionAttributes,
      userId: this.identityId, // TODO may want to switch this to this.user
    });

    return postContentReq.promise();
  }
}
