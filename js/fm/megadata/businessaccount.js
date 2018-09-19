﻿/**
 * a class to apply actions on business account in collaboration with API
 */
function BusinessAccount() {
    this.QuotaUpdateFreq = 3e4; // 30 sec - default threshold to update quotas info
    this.invoiceListUpdateFreq = 9e5; // 15 min - default threshold to update invoices list
}

/**
 * Function to add sub user to a business account
 * @param {String} subEmail     email address of new user
 * @param {String} subFName     First name of new user
 * @param {String} subLName     Last name of new user
 * @param {Object} optionals    contain optional fields if any [position,idnum,phonenum,location]
 * @returns {Promise}           Resolves with new add user HANDLE + password
 */
BusinessAccount.prototype.addSubAccount = function (subEmail, subFName, subLName, optionals) {
    "use strict";
    var operationPromise = new MegaPromise();
    var mySelf = this;

    if (checkMail(subEmail)) {
        // promise reject/resolve will return: success,errorCode,errorDesc
        return operationPromise.reject(0, 1,'Invalid Email');
    }
    if (!subFName) {
        return operationPromise.reject(0, 2, 'Empty First Name');
    }
    if (!subLName) {
        return operationPromise.reject(0, 3, 'Empty Last Name');
    }

    var request = {
        "a": "sbu", // business sub account operation
        "aa": "a", // add operation
        "m": subEmail, // email address of user to add
        "firstname": base64urlencode(to8(subFName)), // first name of user to add (not base64 encoded like attributes are)
        "lastname": base64urlencode(to8(subLName)) // last name of user to add (also not base64 encoded)
    };

    if (optionals) {
        if (optionals.position) {
            request['%position'] = base64urlencode(to8(optionals.position));
        }
        if (optionals.idnum) {
            request['%idnum'] = base64urlencode(to8(optionals.idnum));
        }
        if (optionals.phonenum) {
            request['%phonenum'] = base64urlencode(to8(optionals.phonenum));
        }
        if (optionals.location) {
            request['%location'] = base64urlencode(to8(optionals.location));
        }
    }

    api_req(request, {
        callback: function (res) {
            if ($.isNumeric(res)) {
                operationPromise.reject(0, res, 'API returned error', request);
            }
            else if (typeof res === 'object') {
                // this must be re done
                // since no action packet will be sent for sub-user adding
                // and since the return handle + password is a true confirmation of success
                // we will simulate the effect locally 
                // however, this may introduce theoretical data inconsistency between server and local
                // as although we know the operation is successful, we are assuming that the server used
                // the sent email + first-name + last-name without any alternation

                //var usr = {
                //    u: res.u,
                //    p: null,
                //    s: 10, // pending
                //    e: request.m, // assuming that the server MUST not change the requested val
                //    firstname: request.firstname, // same assumption as above
                //    lastname: request.lastname, // same assumption as above
                //    position: request['%position'] || '',
                //    idnum: request['%idnum'] || '',
                //    phonenum: request['%phonenum'] || '',
                //    location: request['%location'] || ''
                //};

                //mySelf.parseSUBA(usr, false, true);

                operationPromise.resolve(1, res, request); // new added user handle
            }
            else {
                operationPromise.reject(0, 4, 'API returned error, ret=' + res, request);
            }
        }
    });

    return operationPromise;
};

/**
 * edit sub-user info
 * @param {String} subuserHandle        sub-user handle
 * @param {String} subEmail             new email address, or null to don't change
 * @param {String} subFName             new first name, or null to don't change
 * @param {String} subLName             new last name, or null to don't change
 * @param {any} optionals               new optionals, or null to don't change
 */
BusinessAccount.prototype.editSubAccount = function (subuserHandle,subEmail, subFName, subLName, optionals) {
    "use strict";
    var operationPromise = new MegaPromise();

    if (!subuserHandle) {
        return operationPromise.reject(0, 18, 'Empty User Handle');
    }
    if (!subEmail && !subFName && !subLName && !optionals) {
        return operationPromise.reject(0, 19, 'Empty User attributes. nothing to edit');
    }
    if (subEmail && checkMail(subEmail)) {
        return operationPromise.reject(0, 1, 'Invalid Email');
    }

    var request = {
        "a": "upsub",               // business sub account update
        "su": subuserHandle,        // sub-user handle
    };
    if (subEmail) {
        request['email'] = subEmail;
    }
    if (subFName) {
        request.firstname = base64urlencode(to8(subFName));
    }
    if (subLName) {
        request.lastname = base64urlencode(to8(subLName));
    }
    if (optionals) {
        if (optionals.position) {
            request['%position'] = base64urlencode(to8(optionals.position));
        }
        if (optionals.idnum) {
            request['%idnum'] = base64urlencode(to8(optionals.idnum));
        }
        if (optionals.phonenum) {
            request['%phonenum'] = base64urlencode(to8(optionals.phonenum));
        }
        if (optionals.location) {
            request['%location'] = base64urlencode(to8(optionals.location));
        }
    }

    api_req(request, {
        callback: function (res) {
            if ($.isNumeric(res)) {
                operationPromise.reject(0, res, 'API returned error');
            }
            else if (typeof res === 'string') {
                operationPromise.resolve(1); // user edit succeeded
            }
            else if (typeof res === 'object') {
                operationPromise.resolve(1, res, request); // user edit involved email change
            }
            else {
                operationPromise.reject(0, 4, 'API returned error, ret=' + res);
                if (d) {
                    console.error('API returned error, ret=' + res);
                }
            }
        }

    });

    return operationPromise;
};

/**
 * Function to deactivate sub user from business account
 * @param {String} subUserHandle    sub user handle to deactivate
 * @returns {Promise}               Resolves deactivate operation result
 */
BusinessAccount.prototype.deActivateSubAccount = function (subUserHandle) {
    "use strict";
    var operationPromise = new MegaPromise();
    if (!subUserHandle || subUserHandle.length !== 11) {
        return operationPromise.reject(0, 5, 'invalid U_HANDLE');
    }
    if (!M.suba[subUserHandle]) {
        return operationPromise.reject(0, 7, 'u_handle is not a sub-user');
    }

    var request = {
        "a": "sbu", // business sub account operation
        "aa": "d", // deactivate operation
        "u": subUserHandle // user handle to deactivate
    };

    api_req(request, {
        callback: function (res) {
            if ($.isNumeric(res)) {
                if (res !== 0) {
                    operationPromise.reject(0, res, 'API returned error');
                }
                else {
                    operationPromise.resolve(1); // user deactivated successfully
                }
            }
            else {
                operationPromise.reject(0, 4, 'API returned error, ret=' + res);
                if (d) {
                    console.error('API returned error, ret=' + res);
                }
            }
        }

    });

    return operationPromise;
};

/**
 * Function to activate sub user in business account
 * @param {String} subUserHandle    sub user handle to activate
 * @returns {Promise}               Resolves activate operation result
 */
BusinessAccount.prototype.activateSubAccount = function (subUserHandle) {
    "use strict";
    var operationPromise = new MegaPromise();
    if (!subUserHandle || subUserHandle.length !== 11) {
        return operationPromise.reject(0, 5, 'invalid U_HANDLE');
    }
    if (!M.suba[subUserHandle]) {
        return operationPromise.reject(0, 7, 'u_handle is not a sub-user');
    }

    var request = {
        "a": "sbu", // business sub account operation
        "aa": "c", // activate operation
        "u": subUserHandle // user handle to activate
    };

    api_req(request, {
        callback: function (res) {
            if ($.isNumeric(res) && res === 0) {
                operationPromise.resolve(1, res, request); // activated used successfully, non need for re-init
            }
            else if (typeof res === 'object') {
                operationPromise.resolve(1, res, request); // user activated successfully, object contain lp + u
            }
            else {
                operationPromise.reject(0, 4, 'API returned error, ret=' + res);
            }
        }

    });

    return operationPromise;
};

/**
 * Function to get the master key of a sub user in business account
 * @param {String} subUserHandle    sub user handle to get the master key of
 * @returns {Promise}               Resolves operation result
 */
BusinessAccount.prototype.getSubAccountMKey = function (subUserHandle) {
    "use strict";
    var operationPromise = new MegaPromise();
    if (!subUserHandle || subUserHandle.length !== 11) {
        return operationPromise.reject(0, 5, 'invalid U_HANDLE');
    }
    if (!M.suba[subUserHandle]) {
        return operationPromise.reject(0, 7, 'u_handle is not a sub-user');
    }

    var request = {
        "a": "sbu", // business sub account operation
        "aa": "k", // get master-key operation
        "u": subUserHandle // user handle to get key of
    };

    api_req(request, {
        callback: function (res) {
            if ($.isNumeric(res)) {
                operationPromise.reject(0, res, 'API returned error');
            }
            else if (typeof res === 'object') {
                operationPromise.resolve(1, res); // sub-user master-key
            }
            else {
                operationPromise.reject(0, 4, 'API returned error, ret=' + res);
            }
        }

    });

    return operationPromise;
};

/**
 * Function to get Quota usage Report between two dates.
 * @param {boolan} forceUpdate      a flag to force updating the cached values
 * @param {Object} fromToDate       object contains .fromDate and .toDate YYYYMMDD
 * @returns {Promise}               Resolves operation result
 */
BusinessAccount.prototype.getQuotaUsageReport = function (forceUpdate, fromToDate) {
    "use strict";
    var operationPromise = new MegaPromise();

    if (!fromToDate || !fromToDate.fromDate || !fromToDate.toDate
        || fromToDate.fromDate.length !== fromToDate.toDate.length
        || fromToDate.fromDate.length !== 8) {
        return operationPromise.reject(0, 10, 'invalid FromToDate');
    }

    var context = Object.create(null);
    context.dates = fromToDate;
    var request = {
        "a": "sbu", // business sub account operation
        "aa": "q" // get quota info
    };

    if (!forceUpdate) {
        if (mega.buinsessAccount && mega.buinsessAccount.quotaReport) {
            var storedDates = Object.keys(mega.buinsessAccount.quotaReport);
            storedDates.sort();
            var oldestStoredDate = storedDates[0];
            var newestStoredDate = storedDates[storedDates.length - 1];

            // best case scenario, the period we want is inside the saved
            if (fromToDate.fromDate >= oldestStoredDate && fromToDate.toDate <= newestStoredDate) {
                var result = Object.create(null);
                var start = storedDates.indexOf(fromToDate.fromDate);
                var end = storedDates.indexOf(fromToDate.toDate);
                for (var k = start; k <= end; k++) {
                    result[storedDates[k]] = mega.buinsessAccount.quotaReport[storedDates[k]];
                }
                operationPromise.resolve(1, result); // quota report
            }
            // the second case, left wing of saved data
            else if (fromToDate.fromDate < oldestStoredDate && fromToDate.toDate <= newestStoredDate) {
                // we need to get data from "fromDate" to "oldestStoredDate-1"
                var upperDate = new Date(oldestStoredDate.substr(0, 4), oldestStoredDate.substr(4, 2),
                    oldestStoredDate.substr(6, 2));
                upperDate.setDate(upperDate.getDate() - 1);

                request.fd = fromToDate.fromDate;

                var upperDateStr = upperDate.getMonth() + '';
                if (upperDateStr.length < 2) {
                    upperDateStr = '0' + upperDateStr;
                }
                upperDateStr = upperDate.getFullYear() + upperDateStr;
                var tempDay = upperDate.getDate() + '';
                if (tempDay.length < 2) {
                    tempDay = '0' + tempDay;
                }
                upperDateStr += tempDay;

                request.td = upperDateStr;
            }
            // the third case, right wing of saved data
            else if (fromToDate.fromDate >= oldestStoredDate && fromToDate.toDate > newestStoredDate) {
                // we need to get data from "newestStoredDate+1" to "toDate"
                var lowerDate = new Date(newestStoredDate.substr(0, 4), newestStoredDate.substr(4, 2),
                    newestStoredDate.substr(6, 2));
                lowerDate.setDate(lowerDate.getDate() + 1);

                request.td = fromToDate.toDate;

                var lowerDateStr = lowerDate.getMonth() + '';
                if (lowerDateStr.length < 2) {
                    lowerDateStr = '0' + lowerDateStr;
                }
                lowerDateStr = lowerDate.getFullYear() + lowerDateStr;
                var tempDay2 = lowerDate.getDate() + '';
                if (tempDay2.length < 2) {
                    tempDay2 = '0' + tempDay2;
                }
                lowerDateStr += tempDay2;

                request.fd = lowerDateStr;
            }
            // Else case left + right --> call recursively and combine them then return
            // in the current UI is not possible to generate such case
        }
    }

    if (!request.fd || !request.td) {
        request.fd = fromToDate.fromDate;
        request.td = fromToDate.toDate;
    }

    api_req(request, {
        context: context,
        callback: function (res,ctx) {
            if ($.isNumeric(res)) {
                operationPromise.reject(0, res, 'API returned error');
            }
            else if (typeof res === 'object') {
                mega.buinsessAccount = mega.buinsessAccount || Object.create(null);
                mega.buinsessAccount.quotaReport = mega.buinsessAccount.quotaReport || Object.create(null);

                for (var repDay in res) {
                    mega.buinsessAccount.quotaReport[repDay] = res[repDay];
                }

                var orderedDates = Object.keys(mega.buinsessAccount.quotaReport);
                orderedDates.sort();

                var startIx = 0;
                var startFound = false;
                for (startIx = 0; startIx < orderedDates.length; startIx++) {
                    if (orderedDates[startIx] >= ctx.context.dates.fromDate) {
                        startFound = true;
                        break;
                    }
                }
                if (orderedDates[startIx].substr(4, 2) > ctx.context.dates.fromDate.substr(4, 2)) {
                    // found date is in the next month
                    operationPromise.resolve(1, Object.create(null)); // quota info
                }
                // quit if we didnt find the data, report in future !!
                if (!startFound) {
                    console.error('Requested report start-date is not found (in the future)');
                    return operationPromise.reject(0, res, 'Requested report start-date is not found (in future)');
                }

                var result = Object.create(null);
                var endIx = -1;
                for (endIx = startIx; endIx < orderedDates.length; endIx++) {
                    if (orderedDates[endIx] > ctx.context.dates.toDate) {
                        break;
                    }

                    result[orderedDates[endIx]] = res[orderedDates[endIx]];

                    if (orderedDates[endIx] === ctx.context.dates.toDate) {
                        break;
                    }
                }

                // quit if we didnt find the data
                //if (endIx === orderedDates.length && orderedDates[endIx] !== ctx.context.dates.toDate) {
                //    result = null;
                //    console.error('Requested report end-date is not found');
                //    return operationPromise.reject(0, res, 'Requested report end-date is not found');
                //}

                operationPromise.resolve(1, result); // quota info
            }
            else {
                operationPromise.reject(0, 4, 'API returned error, ret=' + res);
            }
        }

    });

    return operationPromise;
};


/**
 * Function to get Quota usage info for the master account and each sub account.
 * @param {boolan} forceUpdate      a flag to force updating the cached values
 * @returns {Promise}               Resolves operation result
 */
BusinessAccount.prototype.getQuotaUsage = function (forceUpdate) {
    "use strict";
    var operationPromise = new MegaPromise();
    if (!forceUpdate) {
        if (mega.buinsessAccount && mega.buinsessAccount.quotas) {
            var currTime = new Date().getTime();
            if (mega.buinsessAccount.quotas.timestamp &&
                (currTime - mega.buinsessAccount.quotas.timestamp) < this.QuotaUpdateFreq) {
                return operationPromise.resolve(1, mega.buinsessAccount.quotas);
            }
        }
    }

    var request = {
        "a": "sbu", // business sub account operation
        "aa": "q" // get quota info
    };

    api_req(request, {
        callback: function (res) {
            if ($.isNumeric(res)) {
                operationPromise.reject(0, res, 'API returned error');
            }
            else if (typeof res === 'object') {
                var currTime = new Date().getTime();
                res.timestamp = currTime;
                mega.buinsessAccount = mega.buinsessAccount || Object.create(null);
                mega.buinsessAccount.quotas = res;
                operationPromise.resolve(1, res); // quota info
            }
            else {
                operationPromise.reject(0, 4, 'API returned error, ret=' + res);
            }
        }

    });

    return operationPromise;
};


/**
 * a function to parse the JSON object received holding information about a sub-account of a business account.
 * @param {string} suba    the object to parse, it must contain a sub-account ids
 * @param {boolean} ignoreDB if we want to skip DB updating
 * @param {boolean} fireUIEvent if we want to fire a n event to update ui
 */
BusinessAccount.prototype.parseSUBA = function (suba, ignoreDB, fireUIEvent) {
    "use strict";
    if (M) {
        // M.isBusinessAccountMaster = 1; // init it, or re-set it

        if (!M.suba) {
            M.suba = [];
        }
        if (!suba) {
            return;
        }
        M.suba[suba.u] = suba; // i will keep deleted in sub-accounts in DB and MEM as long as i receive them
        /**
         * SUBA object:
         *      -u: handle
         *      -p: parent {for future multilevel business accounts}
         *      -s: status {10=pending confirmation , 11:disabled, 12:deleted, 0:enabled and OK}
         *      -e: email
         *      -firstname
         *      -lastname
         *      -position
         *      -idnum
         *      -phonenum
         *      -location
         */
    }
    if (fmdb && !ignoreDB && !pfkey && !folderlink) {
        fmdb.add('suba', { s_ac: suba.u, d: suba });
    }
    if (fireUIEvent) {
        mBroadcaster.sendMessage('business:subuserUpdate', suba);
    }
};

/**
 * Function to check if the current logged in user is a Business Account Master
 * @returns {boolean}   true if the user is a Master B-Account
 */
BusinessAccount.prototype.isBusinessMasterAcc = function () {
    if ((u_attr.b && !u_attr.b.mu) || (M.suba && M.suba.length)) {
        return true;
    }
    return false;
};

/**
 * Decrypting the link sent to sub-account using a password 
 * @param {string} link         invitation link #businesssignup<link> without #businesssignup prefix
 * @param {string} password     The password which the sub-user entered to decrypt the link
 * @returns {string}            base64 sign-up-code (decryption result)
 */
BusinessAccount.prototype.decryptSubAccountInvitationLink = function (link, password) {
    if (!link || !password) {
        return null;
    }
    try {
        var keyFromPassword = base64_to_a32(password);
        var aesCipher = new sjcl.cipher.aes(keyFromPassword);
        var decryptedTokenArray32 = aesCipher.decrypt(base64_to_a32(link));
        var decryptedTokenArray8 = a32_to_ab(decryptedTokenArray32);
        decryptedTokenArray8 = decryptedTokenArray8.slice(0, 15);
        var decryptedTokenBase64 = ab_to_base64(decryptedTokenArray8);
        return decryptedTokenBase64;
    }
    catch (exp) {
        console.error(exp);
        if (exp.stack) {
            console.error(exp.stack);
        }
        return null;
    }
    
};

/**
 * Get info associated with sign-up code
 * @param {string} signupCode       sign-up code to fetch info for
 * @returns {Promise}                Promise resolves an object contains fetched info
 */
BusinessAccount.prototype.getSignupCodeInfo = function (signupCode) {
    if (!signupCode) {
        return null;
    }
    var operationPromise = new MegaPromise();
    var request = {
        "a": "uv2", // business sub account operation - get signupcode info
        "c": signupCode // the code
    };

    api_req(request, {
        callback: function (res) {
            if (typeof res === 'object') {
                operationPromise.resolve(1, res); // sub-user info
            }
            else {
                operationPromise.reject(0, res, 'API returned error');
            }
        }
    });

    return operationPromise;
};

///**
// * migrate a sub-user data to a target destination
// * @param {string} subUserHandle        sub-user handle to migrate the data from
// * @param {string} target               node handle for a folder to migrate the data to
// * @returns {Promise}                   resolves if the operation succeeded
// */
//BusinessAccount.prototype.migrateSubUserData = function (subUserHandle, target) {
//    "use strict";
//    var operationPromise = new MegaPromise();
//    var mySelf = this;

//    if (!subUserHandle || subUserHandle.length !== 11) {
//        return operationPromise.reject(0, 5, 'invalid U_HANDLE');
//    }
//    if (!target) {
//        return operationPromise.reject(0, 6, 'Target is empty');
//    }
//    if (!M.suba[subUserHandle]) {
//        return operationPromise.reject(0, 7, 'u_handle is not a sub-user');
//    }


//    var failReject = function (st, res, res2) {
//        operationPromise.reject(st, res, res2);
//    };

//    var gettingSubTreePromise = this.getSubUserTree(subUserHandle);

//    gettingSubTreePromise.done(function (st, res) {
//        var gettingSubMasterKey = mySelf.getSubAccountMKey(subUserHandle);
//        gettingSubMasterKey.fail(failReject);
//        gettingSubMasterKey.done(function (st2, res2) {
//            var treeObj = mySelf.decrypteSubUserTree(res.f, res2.k);
//            if (!treeObj) {
//                return operationPromise.reject(0, 9, 'Fatal error in sub-user tree encryption');
//            }
//            else {
//                var folderName = M.suba[subUserHandle].e;
//                folderName += '_' + Date.now();
//                var cpyPromise = mySelf.copySubUserTreeToMasterRoot(treeObj.tree, folderName);


//            }
//        });
//    });

//    gettingSubTreePromise.fail(failReject);




//    return operationPromise;
//};

/**
 * copying the sub-user decrypted tree to master user root
 * @param {Array} treeObj       sub-user tree decrypted
 * @param {string} folderName   name of the folder to create in master's root
 * @returns {Promise}           resolves if oprtation succeeded
 */
BusinessAccount.prototype.copySubUserTreeToMasterRoot = function (treeObj, folderName) {
    "use strict";
    var operationPromise = new MegaPromise();

    if (!treeObj || !treeObj.length) {
        return operationPromise.reject(0, 10, 'sub-user tree is empty or invalid');
    }
    if (!folderName) {
        return operationPromise.reject(0, 12, 'folder name is not valid');
    }
    if (!M.RootID) {
        return operationPromise.reject(0, 11, 'Master user root could not be found');
    }

    var fNode = { name: folderName };
    var attr = ab_to_base64(crypto_makeattr(fNode));
    var key = a32_to_base64(encrypt_key(u_k_aes, fNode.k));

    var request = {
        "a": "p",
        "t": M.RootID,
        "n": [{ h: 'xxxxxxxx', t: 1, a: attr, k: key }],
        "i": requesti
    };

    var sn = M.getShareNodesSync(M.RootID);
    if (sn.length) {
        request.cr = crypto_makecr([fNode], sn, false);
        request.cr[1][0] = 'xxxxxxxx';
    }

    api_req(request, {
        callback: function subUserFolderCreateApiResultHandler(res) {
            if (res && typeof res === 'object') {
                var n = Array.isArray(res.f) && res.f[0];

                if (!n || typeof n !== 'object' || typeof n.h !== 'string' || n.h.length !== 8) {
                    return operationPromise.reject(0, res, 'Empty returned Node');
                }

                M.addNode(n);
                ufsc.addNode(n);

                var copyPromise = new MegaPromise();
                var treeToCopy = [];
                var opSize = 0;

                for (var h = 1; h < treeObj.length; h++) {
                    var originalNode = treeObj[h];
                    var newNode = {};

                    if (!originalNode.t) {
                        newNode.k = originalNode.k;
                        opSize += originalNode.s || 0;
                    }

                    newNode.a = ab_to_base64(crypto_makeattr(originalNode, newNode));
                    newNode.h = originalNode.h;
                    newNode.p = originalNode.p;
                    newNode.t = originalNode.t;
                    if (newNode.p === treeObj[0].h) {
                        delete newNode.p;
                    }

                    treeToCopy.push(newNode);
                }
                treeToCopy.opSize = opSize;

                M.copyNodes(treeToCopy, n.h, false, copyPromise, treeToCopy);
                //treeObj.shift();
                //M.copyNodes(treeObj, n.h, false, copyPromise, treeObj);

                copyPromise.fail(function (err) {
                    operationPromise.reject(0, err, 'copying failed');
                });

                copyPromise.done(function (results) {
                    operationPromise.resolve(1, results);
                });
            }
            else {
                operationPromise.reject(0, res, 'API returned error');
            }
        }
    });

    return operationPromise;
};


/**
 * decrypt the sub-user tree using the passed key
 * @param {Array} treeF     sub-user tree as an array of nodes
 * @param {string} key      sub-user's master key
 * @returns {object}        if succeeded, contains .tree attribute and .errors .warn
 */
BusinessAccount.prototype.decrypteSubUserTree = function (treeF, key) {
    "use strict";

    if (!treeF || !treeF.length || !key) {
        return null;
    }
    if (!u_privk) {
        return null;
    }

    var t = base64urldecode(key);
    var dKey = crypto_rsadecrypt(t, u_privk);
    var subUserKey = new sjcl.cipher.aes(str_to_a32(dKey.substr(0, 16)));

    var errors = [];
    var warns = [];
    var er;

    for (var k = 0; k < treeF.length; k++) {
        var nodeKey;
        var p = -1;

        if (typeof treeF[k].k === 'undefined' || treeF[k].name) {
            // no decryption needed
            continue;
        }

        if (typeof treeF[k].k === 'string') {
            if (treeF[k].k.length === 43 || treeF[k].k.length === 22) {
                p = 0;
            }
            else if (treeF[k].k[11] === ':') {
                p = 12;
            }

            if (p >= 0) {
                var pp = treeF[k].k.indexOf('/', p + 21);

                if (pp < 0) {
                    pp = treeF[k].k.length;
                }

                var stringKey = treeF[k].k.substr(p, pp - p);

                if (stringKey.length < 44) {
                    // short keys: AES
                    var keyInt = base64_to_a32(stringKey);

                    // check for permitted key lengths (4 == folder, 8 == file)
                    if (keyInt.length === 4 || keyInt.length === 8) {
                        nodeKey = decrypt_key(subUserKey, keyInt);
                    }
                    else {
                        er = treeF[k].h + ": Received invalid key length [sub-user] (" + keyInt.length + "): ";
                        errors.push(er);
                        console.error(er);
                        nodeKey = false;
                    }
                }
                else {
                    er = treeF[k].h + ": strange key length = " + stringKey.length + '  ' + stringKey;
                    errors.push(er);
                    console.error(er);
                    nodeKey = false;
                }
            }
        }
        else {
            nodeKey = treeF[k].k;
        }

        if (nodeKey) {
            if (treeF[k].a) {
                crypto_procattr(treeF[k], nodeKey);
            }
            else {
                if (treeF[k].t < 2) {
                    er = treeF[k].h + ': Missing attribute for node @sub-user ';
                    warns.push(er);
                    console.warn(er);
                }
            }
        }
        else {
            er = treeF[k].h + ": nothing could be done to this node";
            errors.push(er);
            console.error(er);
        }
    }
    return { "tree": treeF, "errors": errors, "warns": warns };
};

/**
 * get the sub-user tree
 * @param {string} subUserHandle    Handle of a sub-user
 * @returns {Promise}               resolve if the operation succeeded
 */
BusinessAccount.prototype.getSubUserTree = function (subUserHandle) {
    "use strict";
    var operationPromise = new MegaPromise();

    if (!subUserHandle || subUserHandle.length !== 11) {
        return operationPromise.reject(0, 5, 'invalid U_HANDLE');
    }
    if (!M.suba[subUserHandle]) {
        return operationPromise.reject(0, 7, 'u_handle is not a sub-user');
    }

    // getting sub-user tree

    var request = {
        "a": "fsub", // operation - get user tree
        "su": subUserHandle, // sub-user Handle
        "r": 1, // recursive
        "c": 0 // don't get extra data (contacts, sub-users ...etc)
    };

    api_req(request, {
        callback: function (res) {
            if (typeof res === 'object') {
                operationPromise.resolve(1, res); // sub-user tree
            }
            else {
                operationPromise.reject(0, res, 'API returned error');
            }
        }
    });

    return operationPromise;
};


/**
 * get invoice details
 * @param {String} invoiceID            invoice unique id
 * @param {Boolean} forceUpdate         a flag to force getting info from API not using the cache
 * @returns {Promise}                   resolve if the operation succeeded
 */
BusinessAccount.prototype.getInvoiceDetails = function (invoiceID, forceUpdate) {
    "use strict";
    var operationPromise = new MegaPromise();
    if (!forceUpdate) {
        if (mega.buinsessAccount && mega.buinsessAccount.invoicesDetailsList
            && mega.buinsessAccount.invoicesDetailsList[invoiceID]) {
            var currTime = new Date().getTime();
            var cachedTime = mega.buinsessAccount.invoicesDetailsList[invoiceID].timestamp;
            if (cachedTime && (currTime - cachedTime) < this.invoiceListUpdateFreq) {
                return operationPromise.resolve(1, mega.buinsessAccount.invoicesDetailsList[invoiceID]);
            }
        }
    }

    var request = {
        "a": "id", // get invoice details
        "n": invoiceID   // invoice number
    };

    api_req(request, {
        callback: function (res) {
            if ($.isNumeric(res)) {
                operationPromise.reject(0, res, 'API returned error');
            }
            else if (typeof res === 'object') {
                var currTime = new Date().getTime();
                mega.buinsessAccount = mega.buinsessAccount || Object.create(null);
                mega.buinsessAccount.invoicesDetailsList = mega.buinsessAccount.invoicesDetailsList
                    || Object.create(null);
                res.timestamp = currTime;
                
                mega.buinsessAccount.invoicesDetailsList[invoiceID] = res;
                operationPromise.resolve(1, res); // invoice detail
            }
            else {
                operationPromise.reject(0, 4, 'API returned error, ret=' + res);
            }
        }

    });
    return operationPromise;
};


/**
 * a function to get a list of payment gateways for business accounts
 * @param {Boolean} forceUpdate         force updating from API
 * @returns {Promise}                   resolves when we get the answer
 */
BusinessAccount.prototype.getListOfPaymentGateways = function (forceUpdate) {
    "use strict";
    var operationPromise = new MegaPromise();

    if (!forceUpdate) {
        if (mega.buinsessAccount && mega.buinsessAccount.cachedBusinessGateways) {
            var currTime = new Date().getTime();
            if (mega.buinsessAccount.cachedBusinessGateways.timestamp &&
                (currTime - mega.buinsessAccount.cachedBusinessGateways.timestamp) < this.invoiceListUpdateFreq) {
                return operationPromise.resolve(1, mega.buinsessAccount.cachedBusinessGateways.list);
            }
        }
    }

    var request = {
        a: "ufpqfull",  // get a list of payment gateways
        d: 0,           // get all gateways [debugging]
        t: 0
    };

    api_req(request, {
        callback: function (res) {
            if ($.isNumeric(res)) {
                operationPromise.reject(0, res, 'API returned error');
            }
            else if (typeof res === 'object') {
                var currTime = new Date().getTime();
                mega.buinsessAccount = mega.buinsessAccount || Object.create(null);
                var paymentGateways = Object.create(null);
                paymentGateways.timestamp = currTime;
                var res2 = [];
                for (var h = 0; h < res.length; h++) {
                    if (res[h].supportsBusinessPlans) {
                        res2.push(res[h]);
                    }
                }
                paymentGateways.list = res2;
                mega.buinsessAccount.cachedBusinessGateways = paymentGateways;
                operationPromise.resolve(1, res2); // payment gateways list
            }
            else {
                operationPromise.reject(0, 4, 'API returned error, ret=' + res);
            }
        }

    });

    return operationPromise;
};


/**
 * a function to get the business account plan (only 1). as the UI is not ready to handle more than 1 plan
 * @param {Boolean} forceUpdate         force updating from API
 * @returns {Promise}                   resolves when we get the answer
 */
BusinessAccount.prototype.getBusinessPlanInfo = function (forceUpdate) {
    "use strict";
    var operationPromise = new MegaPromise();

    if (!forceUpdate) {
        if (mega.buinsessAccount && mega.buinsessAccount.cachedBusinessPlan) {
            var currTime = new Date().getTime();
            if (mega.buinsessAccount.cachedBusinessPlan.timestamp &&
                (currTime - mega.buinsessAccount.cachedBusinessPlan.timestamp) < this.invoiceListUpdateFreq) {
                return operationPromise.resolve(1, mega.buinsessAccount.cachedBusinessPlan);
            }
        }
    }

    var request = {
        a: "utqa",  // get a list of plans
        nf: 1,      // extended format
        b: 1        // also show business plans
    };

    api_req(request, {
        callback: function (res) {
            if ($.isNumeric(res)) {
                operationPromise.reject(0, res, 'API returned error');
            }
            else if (typeof res === 'object') {
                var currTime = new Date().getTime();
                mega.buinsessAccount = mega.buinsessAccount || Object.create(null);
                var businessPlan = Object.create(null);
                businessPlan.timestamp = currTime;
                for (var h = 0; h < res.length; h++) {
                    if (res[h].it) {
                        businessPlan = res[h];
                        businessPlan.timestamp = currTime;
                        break;
                    }
                }
                mega.buinsessAccount.cachedBusinessPlan = businessPlan;
                operationPromise.resolve(1, businessPlan); // payment gateways list
            }
            else {
                operationPromise.reject(0, 4, 'API returned error, ret=' + res);
            }
        }

    });

    return operationPromise;

};


/**
 * Get business account list of invoices
 * @param {Boolean} forceUpdate         a flag to force getting info from API not using the cache
 * @returns {Promise}                   resolve if the operation succeeded
 */
BusinessAccount.prototype.getAccountInvoicesList = function (forceUpdate) {
    "use strict";
    var operationPromise = new MegaPromise();

    if (!forceUpdate) {
        if (mega.buinsessAccount && mega.buinsessAccount.invoicesList) {
            var currTime = new Date().getTime();
            if (mega.buinsessAccount.invoicesList.timestamp &&
                (currTime - mega.buinsessAccount.invoicesList.timestamp) < this.invoiceListUpdateFreq) {
                return operationPromise.resolve(1, mega.buinsessAccount.invoicesList.list);
            }
        }
    }

    var request = {
        "a": "il" // get a list of invoices
    };

    api_req(request, {
        callback: function (res) {
            if ($.isNumeric(res)) {
                operationPromise.reject(0, res, 'API returned error');
            }
            else if (typeof res === 'object') {
                var currTime = new Date().getTime();
                mega.buinsessAccount = mega.buinsessAccount || Object.create(null);
                var storedBills = Object.create(null);
                storedBills.timestamp = currTime;
                storedBills.list = res;
                mega.buinsessAccount.invoicesList = storedBills;
                operationPromise.resolve(1, res); // invoices list
            }
            else {
                operationPromise.reject(0, 4, 'API returned error, ret=' + res);
            }
        }

    });

    return operationPromise;
};

/**
 * adding business account attributes to business account
 * @param {Number} nbusers      number of users
 * @param {String} cname        company name
 * @param {String} tel          company phone
 * @param {String} fname        first name of the user
 * @param {String} lname        last name of the user
 * @param {String} email        email of the user
 * @param {String} pass         user's entered password
 * @returns {Promise}           resolve with the operation result
 */
BusinessAccount.prototype.setMasterUserAttributes =
    function (nbusers, cname, tel, fname, lname, email, pass) {
        "use strict";
        var operationPromise = new MegaPromise();

        if (!tel) {
            return operationPromise.reject(0, 3, 'Empty phone');
        }
        if (!cname) {
            return operationPromise.reject(0, 4, 'Empty company name');
        }

        var request_upb = {
            "a": "upb",                                     // up - business
            "^companyname": base64urlencode(to8(cname)),    // company name
            "^companyphone": base64urlencode(to8(tel)),     // company phone
            terms: 'Mq',
            firstname: base64urlencode(to8(fname)),
            lastname: base64urlencode(to8(lname)),
            name2: base64urlencode(to8(fname + ' ' + lname))
        };

        if (nbusers) {
            request_upb['^companynbusers'] = base64urlencode(to8(nbusers)); // nb of users
        }

        security.deriveKeysFromPassword(pass, u_k,
            function (clientRandomValueBytes, encryptedMasterKeyArray32, hashedAuthenticationKeyBytes) {

                // Encode parameters to Base64 before sending to the API
                var sendEmailRequestParams = {
                    a: 'uc2',
                    n: base64urlencode(to8(fname + ' ' + lname)),         // Name (used just for the email)
                    m: base64urlencode(email),                                   // Email
                    crv: ab_to_base64(clientRandomValueBytes),                   // Client Random Value
                    k: a32_to_base64(encryptedMasterKeyArray32),                 // Encrypted Master Key
                    hak: ab_to_base64(hashedAuthenticationKeyBytes),             // Hashed Authentication Key
                    v: 2                                                         // Version of this protocol
                };

                api_req([request_upb, sendEmailRequestParams], {
                    callback: function (res1, ctx, queue, res) {
                        if ($.isNumeric(res)) {
                            operationPromise.reject(0, res, 'API returned error');
                        }
                        else if (!Array.isArray(res)) {
                            operationPromise.reject(0, res, 'API returned error');
                        }
                        else if (res.length !== 2) {
                            operationPromise.reject(0, res, 'API returned error');
                        }
                        else if (typeof res[0] !== 'string' || res[1] !== 0) {
                            operationPromise.reject(0, res, 'API returned error');
                        }
                        else {
                            operationPromise.resolve(1, res); // user handle
                        }
                    }

                });


            }
        );

        return operationPromise;
    };

/**
 * update the business account attributes (company)
 * @param {Object[]} attrs              array of key,val of attributes to update
 */
BusinessAccount.prototype.updateBusinessAttrs= function (attrs) {
    "use strict";
    var operationPromise = new MegaPromise();

    if (!attrs) {
        return operationPromise.reject(0, 19, 'Empty attributes array');
    }
    if (!attrs.length) {
        return operationPromise.resolve(1); // as nothing to change.
    }

    var request = {
        "a": "upb" // get a list of invoices
    };

    for (var k = 0; k < attrs.length; k++) {
        request[attrs[k].key] = attrs[k].val;
    }

    api_req(request, {
        callback: function (res) {
            if ($.isNumeric(res)) {
                operationPromise.reject(0, res, 'API returned error');
            }
            else if (typeof res === 'string') {
                operationPromise.resolve(1, res); // update success
            }
            else {
                operationPromise.reject(0, 4, 'API returned error, ret=' + res);
            }
        }
    });

    return operationPromise;
};


/**
 * Do the payment with the API
 * @param {Object} payDetails       payment collected details from payment dialog
 * @param {Object} businessPlan     business plan details
 * @return {Promise}                resolve with the result
 */
BusinessAccount.prototype.doPaymentWithAPI = function (payDetails,businessPlan) {
    "use strict";
    var operationPromise = new MegaPromise();

    if (!payDetails) {
        return operationPromise.reject(0, 11, 'Empty payment details');
    }
    if (!businessPlan) {
        return operationPromise.reject(0, 12, 'Empty business plan details');
    }

    var request = {
        a: 'uts',
        it: businessPlan.it,
        si: businessPlan.id,
        p: businessPlan.totalPrice,
        c: businessPlan.c,
        aff: 0,
        m: m,
        bq: 0,
        pbq: 0,
        num: businessPlan.totalUsers        // number of users
    };


    api_req(request, {
        callback: function (res) {
            if ($.isNumeric(res) && res < 0) {
                operationPromise.reject(0, res, 'API returned error');
            }
            else {

                var utcRequest = {
                    a: 'utc',                   // User Transaction Complete
                    s: [res],                   // Sale ID
                    m: addressDialog.gatewayId, // Gateway number
                    bq: 0,                      // Log for bandwidth quota triggered
                    extra: payDetails           // Extra information for the specific gateway
                };

                api_req(utcRequest, {
                    callback: function (res) {
                        if ($.isNumeric(res) && res < 0) {
                            operationPromise.reject(0, res, 'API returned error');
                        }
                        else if (!res.EUR || !res.EUR.url) {
                            operationPromise.reject(0, res, 'API returned error');
                        }
                        else {
                            operationPromise.resolve(1, res); // ready of redirection
                        }
                    }

                });
            }
        }

    });

    return operationPromise;
};

/**
 * resend invitation link to sub-user with new password
 * @param {String} subuserHandle        sub-user handle
 */
BusinessAccount.prototype.resendInvitation = function (subuserHandle) {
    "use strict";
    var operationPromise = new MegaPromise();

    if (!subuserHandle) {
        return operationPromise.reject(0, 11, 'Empty sub-user handle');
    }

    var request = {
        "a": "sbu",
        "aa": "r",
        "u": subuserHandle // user handle
    };

    api_req(request, {
        callback: function (res) {
            if (typeof res === 'object') {
                operationPromise.resolve(1, res); // user activated successfully, object contain lp + u
            }
            else {
                operationPromise.reject(0, 4, 'API returned error, ret=' + res);
            }
        }
    });

    return operationPromise;
};


/**
 * update a sub user attributes upon their change notification
 * @param {String} subuserHandle            Sub-user handle
 * @param {String[]} changedAttrs           Array of changed attributes names
 */
BusinessAccount.prototype.updateSubUserInfo = function (subuserHandle, changedAttrs) {
    "use strict";

    if (!subuserHandle) {
        return ;
    }
    var mySelf = this;

    var subUser = M.suba[subuserHandle];

    var considereAttrs = ["e", "firstname", "lastname", "%position", "%idnum", "%phonenum", "%location"];
    var totalAttrs = 0;

    var attrFetched = function (res, ctx) {

        if (typeof res !== 'number') {
            if (ctx.ua === "e") {
                subUser.m = res;
            }
            else if (ctx.ua === "firstname") {
                subUser.firstname = res;
            }
            else if (ctx.ua === "lastname") {
                subUser.lastname = res;
            }
            else if (ctx.ua === "%position") {
                subUser["position"] = res;
            }
            else if (ctx.ua === "%idnum") {
                subUser["idnum"] = res;
            }
            else if (ctx.ua === "%phonenum") {
                subUser["phonenum"] = res;
            }
            else if (ctx.ua === "%location") {
                subUser["location"] = res;
            }
        }

        if (!--totalAttrs) {
            mySelf.parseSUBA(subUser, false, true);
        }
    };

    for (var k = 0; k < changedAttrs.length; k++) {
        if (considereAttrs.indexOf(changedAttrs[k]) > -1) {
            totalAttrs++;
            mega.attr.get(subuserHandle, changedAttrs[k], -1, undefined, attrFetched);
        }
    }

};