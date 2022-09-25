import{E as k,g as u,_ as B,a as U,w as v,c as R,v as j,F as O,e as K,C as $,r as y,L as x,S as z,f as V}from"./index.esm2017.711e4997.js";import"./index.esm2017.e538a0ec.js";const M="@firebase/remote-config",I="0.3.11";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class G{constructor(){this.listeners=[]}addEventListener(t){this.listeners.push(t)}abort(){this.listeners.forEach(t=>t())}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const D="remote-config";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const H={["registration-window"]:"Undefined window object. This SDK only supports usage in a browser environment.",["registration-project-id"]:"Undefined project identifier. Check Firebase app initialization.",["registration-api-key"]:"Undefined API key. Check Firebase app initialization.",["registration-app-id"]:"Undefined app identifier. Check Firebase app initialization.",["storage-open"]:"Error thrown when opening storage. Original error: {$originalErrorMessage}.",["storage-get"]:"Error thrown when reading from storage. Original error: {$originalErrorMessage}.",["storage-set"]:"Error thrown when writing to storage. Original error: {$originalErrorMessage}.",["storage-delete"]:"Error thrown when deleting from storage. Original error: {$originalErrorMessage}.",["fetch-client-network"]:"Fetch client failed to connect to a network. Check Internet connection. Original error: {$originalErrorMessage}.",["fetch-timeout"]:'The config fetch request timed out.  Configure timeout using "fetchTimeoutMillis" SDK setting.',["fetch-throttle"]:'The config fetch request timed out while in an exponential backoff state. Configure timeout using "fetchTimeoutMillis" SDK setting. Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.',["fetch-client-parse"]:"Fetch client could not parse response. Original error: {$originalErrorMessage}.",["fetch-status"]:"Fetch server returned an HTTP error status. HTTP status: {$httpStatus}.",["indexed-db-unavailable"]:"Indexed DB is not supported by current browser"},l=new k("remoteconfig","Remote Config",H);function q(s,t){return s instanceof O&&s.code.indexOf(t)!==-1}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Y=!1,J="",P=0,X=["1","true","t","yes","y","on"];class A{constructor(t,e=J){this._source=t,this._value=e}asString(){return this._value}asBoolean(){return this._source==="static"?Y:X.indexOf(this._value.toLowerCase())>=0}asNumber(){if(this._source==="static")return P;let t=Number(this._value);return isNaN(t)&&(t=P),t}getSource(){return this._source}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wt(s=U()){return s=u(s),B(s,D).getImmediate()}async function Q(s){const t=u(s),[e,i]=await Promise.all([t._storage.getLastSuccessfulFetchResponse(),t._storage.getActiveConfigEtag()]);return!e||!e.config||!e.eTag||e.eTag===i?!1:(await Promise.all([t._storageCache.setActiveConfig(e.config),t._storage.setActiveConfigEtag(e.eTag)]),!0)}function W(s){const t=u(s);return t._initializePromise||(t._initializePromise=t._storageCache.loadFromStorage().then(()=>{t._isInitializationComplete=!0})),t._initializePromise}async function Z(s){const t=u(s),e=new G;setTimeout(async()=>{e.abort()},t.settings.fetchTimeoutMillis);try{await t._client.fetch({cacheMaxAgeMillis:t.settings.minimumFetchIntervalMillis,signal:e}),await t._storageCache.setLastFetchStatus("success")}catch(i){const a=q(i,"fetch-throttle")?"throttle":"failure";throw await t._storageCache.setLastFetchStatus(a),i}}function Ct(s){const t=u(s);return tt(t._storageCache.getActiveConfig(),t.defaultConfig).reduce((e,i)=>(e[i]=T(s,i),e),{})}function Et(s,t){return T(u(s),t).asBoolean()}function vt(s,t){return T(u(s),t).asNumber()}function St(s,t){return T(u(s),t).asString()}function T(s,t){const e=u(s);e._isInitializationComplete||e._logger.debug(`A value was requested for key "${t}" before SDK initialization completed. Await on ensureInitialized if the intent was to get a previously activated value.`);const i=e._storageCache.getActiveConfig();return i&&i[t]!==void 0?new A("remote",i[t]):e.defaultConfig&&e.defaultConfig[t]!==void 0?new A("default",String(e.defaultConfig[t])):(e._logger.debug(`Returning static value for key "${t}". Define a default or remote value if this is unintentional.`),new A("static"))}function Tt(s,t){const e=u(s);switch(t){case"debug":e._logger.logLevel=v.DEBUG;break;case"silent":e._logger.logLevel=v.SILENT;break;default:e._logger.logLevel=v.ERROR}}function tt(s={},t={}){return Object.keys(Object.assign(Object.assign({},s),t))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class et{constructor(t,e,i,a){this.client=t,this.storage=e,this.storageCache=i,this.logger=a}isCachedDataFresh(t,e){if(!e)return this.logger.debug("Config fetch cache check. Cache unpopulated."),!1;const i=Date.now()-e,a=i<=t;return this.logger.debug(`Config fetch cache check. Cache age millis: ${i}. Cache max age millis (minimumFetchIntervalMillis setting): ${t}. Is cache hit: ${a}.`),a}async fetch(t){const[e,i]=await Promise.all([this.storage.getLastSuccessfulFetchTimestampMillis(),this.storage.getLastSuccessfulFetchResponse()]);if(i&&this.isCachedDataFresh(t.cacheMaxAgeMillis,e))return i;t.eTag=i&&i.eTag;const a=await this.client.fetch(t),r=[this.storageCache.setLastSuccessfulFetchTimestampMillis(Date.now())];return a.status===200&&r.push(this.storage.setLastSuccessfulFetchResponse(a)),await Promise.all(r),a}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function st(s=navigator){return s.languages&&s.languages[0]||s.language}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class it{constructor(t,e,i,a,r,c){this.firebaseInstallations=t,this.sdkVersion=e,this.namespace=i,this.projectId=a,this.apiKey=r,this.appId=c}async fetch(t){var e,i,a;const[r,c]=await Promise.all([this.firebaseInstallations.getId(),this.firebaseInstallations.getToken()]),g=`${window.FIREBASE_REMOTE_CONFIG_URL_BASE||"https://firebaseremoteconfig.googleapis.com"}/v1/projects/${this.projectId}/namespaces/${this.namespace}:fetch?key=${this.apiKey}`,o={"Content-Type":"application/json","Content-Encoding":"gzip","If-None-Match":t.eTag||"*"},n={sdk_version:this.sdkVersion,app_instance_id:r,app_instance_id_token:c,app_id:this.appId,language_code:st()},f={method:"POST",headers:o,body:JSON.stringify(n)},E=fetch(g,f),F=new Promise((m,w)=>{t.signal.addEventListener(()=>{const L=new Error("The operation was aborted.");L.name="AbortError",w(L)})});let d;try{await Promise.race([E,F]),d=await E}catch(m){let w="fetch-client-network";throw((e=m)===null||e===void 0?void 0:e.name)==="AbortError"&&(w="fetch-timeout"),l.create(w,{originalErrorMessage:(i=m)===null||i===void 0?void 0:i.message})}let _=d.status;const N=d.headers.get("ETag")||void 0;let b,C;if(d.status===200){let m;try{m=await d.json()}catch(w){throw l.create("fetch-client-parse",{originalErrorMessage:(a=w)===null||a===void 0?void 0:a.message})}b=m.entries,C=m.state}if(C==="INSTANCE_STATE_UNSPECIFIED"?_=500:C==="NO_CHANGE"?_=304:(C==="NO_TEMPLATE"||C==="EMPTY_CONFIG")&&(b={}),_!==304&&_!==200)throw l.create("fetch-status",{httpStatus:_});return{status:_,eTag:N,config:b}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function at(s,t){return new Promise((e,i)=>{const a=Math.max(t-Date.now(),0),r=setTimeout(e,a);s.addEventListener(()=>{clearTimeout(r),i(l.create("fetch-throttle",{throttleEndTimeMillis:t}))})})}function rt(s){if(!(s instanceof O)||!s.customData)return!1;const t=Number(s.customData.httpStatus);return t===429||t===500||t===503||t===504}class ot{constructor(t,e){this.client=t,this.storage=e}async fetch(t){const e=await this.storage.getThrottleMetadata()||{backoffCount:0,throttleEndTimeMillis:Date.now()};return this.attemptFetch(t,e)}async attemptFetch(t,{throttleEndTimeMillis:e,backoffCount:i}){await at(t.signal,e);try{const a=await this.client.fetch(t);return await this.storage.deleteThrottleMetadata(),a}catch(a){if(!rt(a))throw a;const r={throttleEndTimeMillis:Date.now()+V(i),backoffCount:i+1};return await this.storage.setThrottleMetadata(r),this.attemptFetch(t,r)}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nt=60*1e3,ct=12*60*60*1e3;class lt{constructor(t,e,i,a,r){this.app=t,this._client=e,this._storageCache=i,this._storage=a,this._logger=r,this._isInitializationComplete=!1,this.settings={fetchTimeoutMillis:nt,minimumFetchIntervalMillis:ct},this.defaultConfig={}}get fetchTimeMillis(){return this._storageCache.getLastSuccessfulFetchTimestampMillis()||-1}get lastFetchStatus(){return this._storageCache.getLastFetchStatus()||"no-fetch-yet"}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function S(s,t){var e;const i=s.target.error||void 0;return l.create(t,{originalErrorMessage:i&&((e=i)===null||e===void 0?void 0:e.message)})}const p="app_namespace_store",gt="firebase_remote_config",ut=1;function ht(){return new Promise((s,t)=>{var e;try{const i=indexedDB.open(gt,ut);i.onerror=a=>{t(S(a,"storage-open"))},i.onsuccess=a=>{s(a.target.result)},i.onupgradeneeded=a=>{const r=a.target.result;switch(a.oldVersion){case 0:r.createObjectStore(p,{keyPath:"compositeKey"})}}}catch(i){t(l.create("storage-open",{originalErrorMessage:(e=i)===null||e===void 0?void 0:e.message}))}})}class ft{constructor(t,e,i,a=ht()){this.appId=t,this.appName=e,this.namespace=i,this.openDbPromise=a}getLastFetchStatus(){return this.get("last_fetch_status")}setLastFetchStatus(t){return this.set("last_fetch_status",t)}getLastSuccessfulFetchTimestampMillis(){return this.get("last_successful_fetch_timestamp_millis")}setLastSuccessfulFetchTimestampMillis(t){return this.set("last_successful_fetch_timestamp_millis",t)}getLastSuccessfulFetchResponse(){return this.get("last_successful_fetch_response")}setLastSuccessfulFetchResponse(t){return this.set("last_successful_fetch_response",t)}getActiveConfig(){return this.get("active_config")}setActiveConfig(t){return this.set("active_config",t)}getActiveConfigEtag(){return this.get("active_config_etag")}setActiveConfigEtag(t){return this.set("active_config_etag",t)}getThrottleMetadata(){return this.get("throttle_metadata")}setThrottleMetadata(t){return this.set("throttle_metadata",t)}deleteThrottleMetadata(){return this.delete("throttle_metadata")}async get(t){const e=await this.openDbPromise;return new Promise((i,a)=>{var r;const h=e.transaction([p],"readonly").objectStore(p),g=this.createCompositeKey(t);try{const o=h.get(g);o.onerror=n=>{a(S(n,"storage-get"))},o.onsuccess=n=>{const f=n.target.result;i(f?f.value:void 0)}}catch(o){a(l.create("storage-get",{originalErrorMessage:(r=o)===null||r===void 0?void 0:r.message}))}})}async set(t,e){const i=await this.openDbPromise;return new Promise((a,r)=>{var c;const g=i.transaction([p],"readwrite").objectStore(p),o=this.createCompositeKey(t);try{const n=g.put({compositeKey:o,value:e});n.onerror=f=>{r(S(f,"storage-set"))},n.onsuccess=()=>{a()}}catch(n){r(l.create("storage-set",{originalErrorMessage:(c=n)===null||c===void 0?void 0:c.message}))}})}async delete(t){const e=await this.openDbPromise;return new Promise((i,a)=>{var r;const h=e.transaction([p],"readwrite").objectStore(p),g=this.createCompositeKey(t);try{const o=h.delete(g);o.onerror=n=>{a(S(n,"storage-delete"))},o.onsuccess=()=>{i()}}catch(o){a(l.create("storage-delete",{originalErrorMessage:(r=o)===null||r===void 0?void 0:r.message}))}})}createCompositeKey(t){return[this.appId,this.appName,this.namespace,t].join()}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dt{constructor(t){this.storage=t}getLastFetchStatus(){return this.lastFetchStatus}getLastSuccessfulFetchTimestampMillis(){return this.lastSuccessfulFetchTimestampMillis}getActiveConfig(){return this.activeConfig}async loadFromStorage(){const t=this.storage.getLastFetchStatus(),e=this.storage.getLastSuccessfulFetchTimestampMillis(),i=this.storage.getActiveConfig(),a=await t;a&&(this.lastFetchStatus=a);const r=await e;r&&(this.lastSuccessfulFetchTimestampMillis=r);const c=await i;c&&(this.activeConfig=c)}setLastFetchStatus(t){return this.lastFetchStatus=t,this.storage.setLastFetchStatus(t)}setLastSuccessfulFetchTimestampMillis(t){return this.lastSuccessfulFetchTimestampMillis=t,this.storage.setLastSuccessfulFetchTimestampMillis(t)}setActiveConfig(t){return this.activeConfig=t,this.storage.setActiveConfig(t)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mt(){K(new $(D,s,"PUBLIC").setMultipleInstances(!0)),y(M,I),y(M,I,"esm2017");function s(t,{instanceIdentifier:e}){const i=t.getProvider("app").getImmediate(),a=t.getProvider("installations-internal").getImmediate();if(typeof window=="undefined")throw l.create("registration-window");if(!R())throw l.create("indexed-db-unavailable");const{projectId:r,apiKey:c,appId:h}=i.options;if(!r)throw l.create("registration-project-id");if(!c)throw l.create("registration-api-key");if(!h)throw l.create("registration-app-id");e=e||"firebase";const g=new ft(h,i.name,e),o=new dt(g),n=new x(M);n.logLevel=v.ERROR;const f=new it(a,z,e,r,c,h),E=new ot(f,g),F=new et(E,g,o,n),d=new lt(i,F,o,g,n);return W(d),d}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ft(s){return s=u(s),await Z(s),Q(s)}async function bt(){if(!R())return!1;try{return await j()}catch{return!1}}mt();export{Q as activate,W as ensureInitialized,Ft as fetchAndActivate,Z as fetchConfig,Ct as getAll,Et as getBoolean,vt as getNumber,wt as getRemoteConfig,St as getString,T as getValue,bt as isSupported,Tt as setLogLevel};
