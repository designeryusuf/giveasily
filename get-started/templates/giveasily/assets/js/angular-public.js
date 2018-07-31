(function() {
    var app = angular.module("myApp", ['angular-ladda']);

    app.controller("paymentCtrl", function(Config, Payments, $scope, $location, $interval, $timeout) {
        var pay = function() {
            $scope.error = "";
            $scope.isLoading = true;
            if($scope.card != null && $scope.card.number != null && $scope.card.expiry != null && $scope.card.cvv != null) {
                var location = $location.$$absUrl.split("/");
                var invoiceId = location[location.length-1];

                var card = {};

                //Validate Number

                // Create an object
                var creditCardValidator = {};
                // Pin the cards to them
                creditCardValidator.cards = {
                    'vv':'(506)[0-9]{0,16}',
                    'mc':'5[1-5][0-9]{14}',
                    'ec':'5[1-5][0-9]{14}',
                    'vi':'4(?:[0-9]{12}|[0-9]{15})',
                    'ax':'3[47][0-9]{13}',
                    'dc':'3(?:0[0-5][0-9]{11}|[68][0-9]{12})',
                    'bl':'3(?:0[0-5][0-9]{11}|[68][0-9]{12})',
                    'di':'6011[0-9]{12}',
                    'jcb':'(?:3[0-9]{15}|(2131|1800)[0-9]{11})',
                    'er':'2(?:014|149)[0-9]{11}'
                };
                // Add the card validator to them
                creditCardValidator.validate = function(value,ccType) {
                    value = String(value).replace(/[- ]/g,''); //ignore dashes and whitespaces

                    var cardinfo = creditCardValidator.cards, results = [];
                    if(ccType){
                        var expr = '^' + cardinfo[ccType.toLowerCase()] + '$';
                        return expr ? !!value.match(expr) : false; // boolean
                    }

                    for(var p in cardinfo){
                        if(value.match('^' + cardinfo[p] + '$')){
                            results.push(p);
                        }
                    }
                    return results.length ? results.join('|') : false; // String | boolean
                };

                if(creditCardValidator.validate($scope.card.number)) {
                    card.number = $scope.card.number.replace(/\s+/g, '');
                }else {
                    $scope.error = "Invalid card number. Please try again.";
                    $scope.isLoading = false;

                    return;
                }

                //Validate Expiry
                var __expiry = $scope.card.expiry.split(" / ");
                if(__expiry.length == 2) {
                    card.expiry_month = ""+__expiry[0]+"";
                    card.expiry_year = ""+__expiry[1]+"";
                }else {
                    var __expiry = $scope.card.expiry.split("/");
                    if(__expiry.length == 2) {
                        card.expiry_month = ""+__expiry[0]+"";
                        card.expiry_year = ""+__expiry[1]+"";
                    }else {
                        $scope.error = "Invalid expiry date. Please try again.";
                        $scope.isLoading = false;

                        return;
                    }
                }

                //Validate CVV
                var validateCvv = function(cvv) {
                    var regex = /^[0-9]{3,4}$/;
                    return regex.test(cvv);
                }
                var __cvv = $scope.card.cvv;
                __cvv = ""+__cvv+"";
                if(__cvv.length == 2) __cvv = "0"+__cvv+"";
                else if(__cvv.length == 1) __cvv = "00"+__cvv+"";
                else if(__cvv.length == 0) __cvv = "000";
                if(validateCvv(__cvv)) {
                    card.cvv = ""+__cvv+"";
                }else {
                    $scope.error = "Invalid CVV2 number. Please try again.";
                    $scope.isLoading = false;

                    return;
                }

                //Pin
                card.pin = $scope.card.pin || "";

                Payments.post(invoiceId, card)
                    .success(function(data) {
                        $scope.isLoading = false;
                        
                        try {
                            if(data.status == "success" && data.data != null) {
                                if(data.data.transfer != null && data.data.authurl != null) {
                                    $scope.paymentObj = data;

                                    $scope.isLoading = false;
                                    $scope.view = 'auth';
                                }else if(data.data.transfer != undefined && data.data.transfer.flutterChargeResponseCode == "02") {
                                    $scope.paymentObj = data;

                                    $scope.isLoading = false;
                                    $scope.view = 'otp';
                                }else if(data.data.flutterChargeResponseCode == "00") {
                                    $scope.isLoading = false;
                                    $scope.view = "successfull";
                                    $scope.error = "";

                                    $timeout(function() {
                                        //Reload page
                                         window.location.reload();
                                    }, 5000);

                                    return;
                                }
                            }else {
                                $scope.error = data.message;
                                $scope.isLoading = false;

                                return;
                            }
                        }catch(err) {
                            $scope.error = 'Something went wrong. Please try again.';
                            $scope.isLoading = false;

                            return;
                        }
                    })
                    .error(function() {
                        $scope.error = "Payment request failed. Please try again.";
                        $scope.isLoading = false;

                        return;
                    }); 

            }else {
                $scope.error = "Card details are required.";
                $scope.isLoading = false;

                return;
            }
        };

        var payBank = function() {
            $scope.error = "";
            $scope.isLoading = true;
            if($scope.bank != null && $scope.bank.id != null) {
                if($scope.bank.id == '044' && !$scope.bank.account) {
                    $scope.error = "Account Number is required.";
                    $scope.isLoading = false;

                    return;
                }

                var location = $location.$$absUrl.split("/");
                var invoiceId = location[location.length-1];

                var bank = {
                    bank_code: $scope.bank.id,
                    account_number: $scope.bank.account || ""
                };

                Payments.postBank(invoiceId, bank)
                    .success(function(data) {
                        $scope.isLoading = false;
                        
                        try {
                            if(data.statuscode == '025' && data.RRR != null) {
                                $scope.paymentObj = data;

                                $scope.isLoading = false;
                                $scope.view = 'bankbranch';
                            }else if(data.status == "success" && data.data != null) {
                                if(data.data.transfer != null && data.data.authurl != null) {
                                    $scope.paymentObj = data;

                                    $scope.validateCard();
                                }else if(data.data.transfer != undefined && data.data.transfer.flutterChargeResponseCode == "02") {
                                    $scope.paymentObj = data;

                                    $scope.isLoading = false;
                                    $scope.view = 'otp';
                                }else if(data.data.flutterChargeResponseCode == "00") {
                                    $scope.isLoading = false;
                                    $scope.view = "successfull";
                                    $scope.error = "";

                                    $timeout(function() {
                                        //Reload page
                                         window.location.reload();
                                    }, 5000);

                                    return;
                                }
                            }else {
                                $scope.error = data.message;
                                $scope.isLoading = false;

                                return;
                            }
                        }catch(err) {
                            $scope.error = 'Something went wrong. Please try again.';
                            $scope.isLoading = false;

                            return;
                        }
                    })
                    .error(function() {
                        $scope.error = "Payment request failed. Please try again.";
                        $scope.isLoading = false;

                        return;
                    }); 
            }else {
                $scope.error = "Account details are required.";
                $scope.isLoading = false;

                return;
            }
        };

        var validateCard = function() {
            $scope.error = "";
            $scope.isLoading = true;
            if($scope.paymentObj != null && $scope.paymentObj.status == "success" && $scope.paymentObj.data != null && $scope.paymentObj.data.transfer != null && $scope.paymentObj.data.authurl != null) {
                var authWindow = window.open($scope.paymentObj.data.authurl, "Card Verification", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=500, height=500, top=100, left=100");
                var windowChecker = $interval(function() {
                    if (authWindow.closed !== false) { // !== opera compatibility reasons
                        $interval.cancel(windowChecker);
                        
                        $scope.view = "verify";
                        //Verify Transaction
                        var location = $location.$$absUrl.split("/");
                        var invoiceId = location[location.length-1];

                        Payments.verify(invoiceId, $scope.payBy)
                            .success(function(data) {
                                if(data.status == "success") {
                                    $scope.isLoading = false;
                                    $scope.view = "successfull";
                                    $scope.error = "";

                                    $timeout(function() {
                                        //Reload page
                                         window.location.reload();
                                    }, 5000);

                                    return;
                                }else {
                                    $scope.isLoading = false;
                                    $scope.error = data.message;
                                    $scope.view = "failed";

                                    return;
                                }
                            })
                            .error(function(data) {
                                $scope.isLoading = false;
                                $scope.error = "Failed to verify payment. Try reloading this page.";
                                $scope.view = "failed";

                                return;
                            });
                    }
                }, 250);
            }else {
                $scope.error = "Card details required.";
                $scope.view = "card";
                $scope.isLoading = false;

                return;
            }
        };

        var verifyOtp = function() {
            $scope.error = "";
            $scope.isLoading = true;
            if($scope.paymentObj != null && $scope.paymentObj.status == "success" && $scope.paymentObj.data != null && $scope.paymentObj.data.transfer.flutterChargeResponseCode == "02") {
                //Verify Transaction
                var location = $location.$$absUrl.split("/");
                var invoiceId = location[location.length-1];

                Payments.verifyOtp(invoiceId, {
                    payBy: $scope.payBy,
                    otp: $scope.card.otp,
                    transactionRef: $scope.paymentObj.data.transfer.flutterChargeReference
                }, $scope.payBy)
                    .success(function(data) {
                        if(data.status == "success") {
                            $scope.isLoading = false;
                            $scope.view = "successfull";
                            $scope.error = "";

                            $timeout(function() {
                                //Reload page
                                 window.location.reload();
                            }, 5000);

                            return;
                        }else {
                            $scope.isLoading = false;
                            $scope.error = data.message || "Failed to validate OTP. Please try again.";
                            //$scope.view = "failed";

                            return;
                        }
                    })
                    .error(function(data) {
                        $scope.isLoading = false;
                        $scope.error = "Failed to verify payment. Try reloading this page.";
                        $scope.view = "failed";

                        return;
                    });
            }else {
                $scope.error = "Payment object not found. Reload page and try again.";
                $scope.view = "otp";
                $scope.isLoading = false;

                return;
            }
        };

        var getCardNumberLength = function(number)  {
            number = number || "";
            return number.replace(/[- ]/g,'').length || 0;
        };

        var isMasterCard = function(number) {
            if(number != null) {
                return /^(5[1-5]|677189)|^(222[1-9]|2[3-6]\d{2}|27[0-1]\d|2720)/.test(number);
            }else {
                return false;
            }
        };

        $scope.pay = pay;
        $scope.validateCard = validateCard;
        $scope.verifyOtp = verifyOtp;
        $scope.getCardNumberLength = getCardNumberLength;
        $scope.isMasterCard = isMasterCard;

        $scope.card = {};
        $scope.paymentObj = {};
        $scope.view = "card";        
        $scope.error = "";

        $scope.payBy = "card";
        $scope.bank = {};
        $scope.payBank = payBank;
        $scope.changePaymentMethod = function(method) {
            $scope.payBy = method;
        }

        $scope.isLoading = false;
    })

    app.controller("buyCtrl", function(Config, Payments, Buy, $scope, $location, $window, $interval, $timeout) {
        $scope.view = "loading";
        $scope.paymentType = "card";
        $scope.paymentData = {};
        $scope.paymentData.client = {};
        $scope.paymentData.items = [];
        $scope.paymentData.card = {};
        $scope.paymentData.shippingaddress = {};
        $scope.clientData = {};
        $scope.paymentCard = {};
        $scope.paymentObj = {};

        $scope.newAddress = {};
        $scope.newCard = {};

        $window.onload = function() {
            $timeout(function() {
                if($window.clientData != undefined && $scope.objectLength($window.clientData) > 0) {
                    $scope.clientData = $window.clientData;
                    
                    if($scope.objectLength($window.clientData.client) > 0) {
                        $scope.paymentData.client = $scope.clientData.client;
                        $scope.paymentType = "token";
                    }
                    if($window.clientData.addresses.length > 0) {
                        $scope.paymentData.shippingaddress = $window.clientData.addresses[0];
                    }
                    if($window.clientData.cards.length > 0) {
                        $scope.paymentData.card = $window.clientData.cards[0];
                    }
                }

                if($scope.objectLength($window.productData) > 0) {
                    $scope.paymentData.items = {
                        item: $window.productData.name,
                        description: $window.productData.description,
                        quantity: '1',
                        unit_cost: $window.productData.unit_cost
                    };
                }

                /*$timeout(function() {
                    var card = new Card({
                        form: '.card-form-2', 
                        container: '.card-wrapper-2',

                        formSelectors: {
                            numberInput: 'input#cardNumber_2', 
                            expiryInput: 'input#expiry_2', 
                            cvcInput: 'input#cvc_2', 
                            nameInput: 'input#name_2' 
                        },

                        // Default placeholders for rendered fields - optional
                        placeholders: {
                            number: '•••• •••• •••• ••••',
                            name: '',
                            expiry: '••/••',
                            cvc: '•••'
                        },

                        masks: {
                            cardNumber: '•'
                        },

                        debug: true
                    });

                    $("#phoneInput").intlTelInput({
                        initialCountry: "NG",
                        preferredCountries: "NG",
                        autoHideDialCode: false,
                        nationalMode: false
                    });
                });*/

                $scope.view = "main";
            }, 500);
        }

        $scope.objectLength = function(object) {
            if(object != undefined)
                return Object.keys(object).length;
            else
                return 0;
        }

        $scope.setActiveCard = function(card) {
            $scope.paymentData.card = card; 
            $scope.view = 'main';
        }

        $scope.changeView = function(view) {
            $scope.view = view;
        }

        $scope.getRouteParams = function(param) {
            var result = "",
                temp = [];

            $window.location.search
                .substr(1)
                .split("&")
                .forEach(function(item) {
                    temp = item.split("=");
                    if(temp[0] === param) result = decodeURIComponent(temp[1]);
                });

                return result;
        }

        $scope.setDefaultAddress = function(address) {
            $scope.paymentData.shippingaddress = address; 
            $scope.view = 'main';
        }

        $scope.isMasterCard = function(number) {
            if(number != null) {
                return /^(5[1-5]|677189)|^(222[1-9]|2[3-6]\d{2}|27[0-1]\d|2720)/.test(number);
            }else {
                return false;
            }
        };

        $scope.isVisaCard = function(number) {
            if(number != null) {
                return /^4/.test(number);
            }else {
                return false;
            }
        };

        $scope.isVerveCard = function(number) {
            if(number != null) {
                return /^(506)[0-9]{0,16}/.test(number);
            }else {
                return false;
            }
        };

        $scope.getCardType = function(number) {
            if($scope.isMasterCard(number) == true) {
                return "MasterCard";
            }else if($scope.isVisaCard(number) == true) {
                return "Visa";
            }else if($scope.isVerveCard(number) == true) {
                return "Verve";
            }else {
                return "Others";
            }
        }

        $scope.getCardNumberLength = function(number)  {
            number = number || "";
            return number.replace(/[- ]/g,'').length || 0;
        };

        $scope.addAddress = function() {
            $scope.isLoading = true;

            var address = $scope.newAddress;
            address.platform_name = $scope.getRouteParams("platform_name");
            address.platform_userid = $scope.getRouteParams("platform_userid");
            address.platform_id = $window.connectionData.platform_id;

            Buy.addAddress(address)
                .success(function(response) {
                    if(response.status == "success") {
                        Buy.getPlatformUser($scope.getRouteParams("platform_name"), $scope.getRouteParams("platform_userid"))
                            .success(function(response) {
                                if(response.status == "success") {
                                    if(response.data.addresses.length > 0) {
                                        if(response.data.addresses.length == 1) $scope.paymentData.shippingaddress = response.data.addresses[0];
                                        $scope.clientData.addresses = response.data.addresses;
                                    }
                                    if(response.data.cards.length > 0) {
                                        $scope.clientData.cards = response.data.cards;
                                    }

                                    $scope.isLoading = false;
                                    $scope.view = 'addresses';
                                    $scope.newAddress = {};
                                }
                            })
                            .error(function() {
                                $scope.error = "Something went wrong while adding shipping address. Please try again.";
                                $scope.isLoading = false;

                                $timeout(function() {
                                    $scope.error = "";
                                }, 3000);
                            })
                    }else {
                        $scope.error = "Something went wrong while adding shipping address. Please try again.";
                        $scope.isLoading = false;

                        $timeout(function() {
                            $scope.error = "";
                        }, 3000);
                    }
                })
                .error(function() {
                    $scope.isLoading = false;
                    $scope.error = "Something went wrong while adding shipping address. Please try again.";

                    $timeout(function() {
                        $scope.error = "";
                    }, 3000);
                });
        }

        $scope.addCardMagic = function() {
            $timeout(function() {
                var card_2 = new Card({
                    form: '.card-form', 
                    container: '.card-wrapper',

                    formSelectors: {
                        numberInput: 'input#cardNumber', 
                        expiryInput: 'input#expiry', 
                        cvcInput: 'input#cvc', 
                        nameInput: 'input#name' 
                    },

                    // Default placeholders for rendered fields - optional
                    placeholders: {
                        number: '•••• •••• •••• ••••',
                        name: '',
                        expiry: '••/••',
                        cvc: '•••'
                    },

                    masks: {
                        cardNumber: '•'
                    },

                    debug: true
                });
            });
        }

        $scope.addCard = function() {
            $scope.isLoading = true;

            if($scope.newCard != null && $scope.newCard.number != null && $scope.newCard.expiry != null && $scope.newCard.cvv != null) {
                var location = $location.$$absUrl.split("/");
                var invoiceId = location[location.length-1];

                var card = {};

                //Validate Number

                // Create an object
                var creditCardValidator = {};
                // Pin the cards to them
                creditCardValidator.cards = {
                    'vv':'(506)[0-9]{0,16}',
                    'mc':'5[1-5][0-9]{14}',
                    'ec':'5[1-5][0-9]{14}',
                    'vi':'4(?:[0-9]{12}|[0-9]{15})',
                    'ax':'3[47][0-9]{13}',
                    'dc':'3(?:0[0-5][0-9]{11}|[68][0-9]{12})',
                    'bl':'3(?:0[0-5][0-9]{11}|[68][0-9]{12})',
                    'di':'6011[0-9]{12}',
                    'jcb':'(?:3[0-9]{15}|(2131|1800)[0-9]{11})',
                    'er':'2(?:014|149)[0-9]{11}'
                };
                // Add the card validator to them
                creditCardValidator.validate = function(value,ccType) {
                    value = String(value).replace(/[- ]/g,''); //ignore dashes and whitespaces

                    var cardinfo = creditCardValidator.cards, results = [];
                    if(ccType){
                        var expr = '^' + cardinfo[ccType.toLowerCase()] + '$';
                        return expr ? !!value.match(expr) : false; // boolean
                    }

                    for(var p in cardinfo){
                        if(value.match('^' + cardinfo[p] + '$')){
                            results.push(p);
                        }
                    }
                    return results.length ? results.join('|') : false; // String | boolean
                };

                if(creditCardValidator.validate($scope.newCard.number)) {
                    card.number = $scope.newCard.number.replace(/\s+/g, '');
                }else {
                    $scope.error = "Invalid card number. Please try again.";
                    $scope.isLoading = false;

                    return;
                }

                //Validate Expiry
                var __expiry = $scope.newCard.expiry.split(" / ");
                if(__expiry.length == 2) {
                    card.expiry_month = ""+__expiry[0]+"";
                    card.expiry_year = ""+__expiry[1]+"";
                }else {
                    var __expiry = $scope.newCard.expiry.split("/");
                    if(__expiry.length == 2) {
                        card.expiry_month = ""+__expiry[0]+"";
                        card.expiry_year = ""+__expiry[1]+"";
                    }else {
                        $scope.error = "Invalid expiry date. Please try again.";
                        $scope.isLoading = false;

                        return;
                    }
                }

                //Validate CVV
                var validateCvv = function(cvv) {
                    var regex = /^[0-9]{3,4}$/;
                    return regex.test(cvv);
                }
                var __cvv = $scope.newCard.cvv;
                __cvv = ""+__cvv+"";
                if(__cvv.length == 2) __cvv = "0"+__cvv+"";
                else if(__cvv.length == 1) __cvv = "00"+__cvv+"";
                else if(__cvv.length == 0) __cvv = "000";
                if(validateCvv(__cvv)) {
                    card.cvv = ""+__cvv+"";
                }else {
                    $scope.error = "Invalid CVV2 number. Please try again.";
                    $scope.isLoading = false;

                    return;
                }

                card.platform_name = $scope.getRouteParams("platform_name");
                card.platform_userid = $scope.getRouteParams("platform_userid");
                card.platform_id = $window.connectionData.platform_id;
                card.type = $scope.getCardType(card.number);

                Buy.addCard(card)
                    .success(function(response) {
                        if(response.status == "success") {
                            Buy.getPlatformUser($scope.getRouteParams("platform_name"), $scope.getRouteParams("platform_userid"))
                                .success(function(response) {
                                    if(response.status == "success") {
                                        if(response.data.addresses.length > 0) {
                                            $scope.clientData.addresses = response.data.addresses;
                                        }
                                        if(response.data.cards.length > 0) {
                                            if(response.data.cards.length == 1) $scope.paymentData.card = response.data.cards[0];
                                            $scope.clientData.cards = response.data.cards;
                                        }

                                        $scope.isLoading = false;
                                        $scope.view = 'cards';
                                        $scope.newCard = {};
                                    }
                                })
                                .error(function() {
                                    $scope.error = "Something went wrong while adding card. Please try again.";
                                    $scope.isLoading = false;

                                    $timeout(function() {
                                        $scope.error = "";
                                    }, 3000);
                                })
                        }else {
                            $scope.error = "Something went wrong while adding card. Please try again.";
                            $scope.isLoading = false;

                            $timeout(function() {
                                $scope.error = "";
                            }, 3000);
                        }
                    })
                    .error(function() {
                        $scope.isLoading = false;
                        $scope.error = "Something went wrong while adding card. Please try again.";

                        $timeout(function() {
                            $scope.error = "";
                        }, 3000);
                    });



            }else {
                $scope.error = "Card details are required.";
                $scope.isLoading = false;

                return;
            }
        }

        $scope.initPayment = function() {
            $scope.error = "";
            $scope.isLoading = true;

            if($scope.paymentType == 'card') {
                var paymentObj = {},
                    card = {};

                if($scope.paymentCard != null && $scope.paymentCard.number != null && $scope.paymentCard.expiry != null && $scope.paymentCard.cvv != null) {
                    //Validate Number

                    // Create an object
                    var creditCardValidator = {};
                    // Pin the cards to them
                    creditCardValidator.cards = {
                        'vv':'(506)[0-9]{0,16}',
                        'mc':'5[1-5][0-9]{14}',
                        'ec':'5[1-5][0-9]{14}',
                        'vi':'4(?:[0-9]{12}|[0-9]{15})',
                        'ax':'3[47][0-9]{13}',
                        'dc':'3(?:0[0-5][0-9]{11}|[68][0-9]{12})',
                        'bl':'3(?:0[0-5][0-9]{11}|[68][0-9]{12})',
                        'di':'6011[0-9]{12}',
                        'jcb':'(?:3[0-9]{15}|(2131|1800)[0-9]{11})',
                        'er':'2(?:014|149)[0-9]{11}'
                    };
                    // Add the card validator to them
                    creditCardValidator.validate = function(value, ccType) {
                        value = String(value).replace(/[- ]/g,''); //ignore dashes and whitespaces

                        var cardinfo = creditCardValidator.cards, results = [];
                        if(ccType){
                            var expr = '^' + cardinfo[ccType.toLowerCase()] + '$';
                            return expr ? !!value.match(expr) : false; // boolean
                        }

                        for(var p in cardinfo){
                            if(value.match('^' + cardinfo[p] + '$')){
                                results.push(p);
                            }
                        }
                        return results.length ? results.join('|') : false; // String | boolean
                    };

                    if(creditCardValidator.validate($scope.paymentCard.number)) {
                        card.number = $scope.paymentCard.number.replace(/\s+/g, '');
                    }else {
                        $scope.error = "Invalid card number. Please try again.";
                        $scope.isLoading = false;

                        return;
                    }

                    //Validate Expiry
                    var __expiry = $scope.paymentCard.expiry.split(" / ");
                    if(__expiry.length == 2) {
                        card.expiry_month = ""+__expiry[0]+"";
                        card.expiry_year = ""+__expiry[1]+"";
                    }else {
                        var __expiry = $scope.paymentCard.number.expiry.split("/");
                        if(__expiry.length == 2) {
                            card.expiry_month = ""+__expiry[0]+"";
                            card.expiry_year = ""+__expiry[1]+"";
                        }else {
                            $scope.error = "Invalid expiry date. Please try again.";
                            $scope.isLoading = false;

                            return;
                        }
                    }

                    //Validate CVV
                    var validateCvv = function(cvv) {
                        var regex = /^[0-9]{3,4}$/;
                        return regex.test(cvv);
                    }
                    var __cvv = $scope.paymentCard.cvv;
                    __cvv = ""+__cvv+"";
                    if(__cvv.length == 2) __cvv = "0"+__cvv+"";
                    else if(__cvv.length == 1) __cvv = "00"+__cvv+"";
                    else if(__cvv.length == 0) __cvv = "000";
                    if(validateCvv(__cvv)) {
                        card.cvv = ""+__cvv+"";
                    }else {
                        $scope.error = "Invalid CVV2 number. Please try again.";
                        $scope.isLoading = false;

                        return;
                    }

                    //Pin
                    card.pin = $scope.paymentData.card.pin || "";
                }else {
                    $scope.error = "Card details are required.";
                    $scope.isLoading = false;
                    return;
                }

                paymentObj.client           = $scope.paymentData.client;
                paymentObj.card             = card;
                paymentObj.type             = $scope.paymentType;
                paymentObj.platform         = {
                    name:   $scope.getRouteParams("platform_name"),
                    userid: $scope.getRouteParams("platform_userid"),
                    id:     ($window.connectionData && $window.connectionData.platform_id != "" ? $window.connectionData.platform_id : "")
                };

                $scope.postPayment(paymentObj);
            }else if($scope.paymentType == 'token') {
                var paymentObj = {};

                paymentObj.client       = $scope.paymentData.client;
                paymentObj.card         = $scope.paymentData.card;
                paymentObj.type         = $scope.paymentType;
                paymentObj.platform         = {
                    name:   $scope.getRouteParams("platform_name"),
                    userid: $scope.getRouteParams("platform_userid"),
                    id:     $window.connectionData.platform_id
                };

                $scope.postPayment(paymentObj);
            }
        };

        $scope.postPayment = function(paymentObj) {
            //Make Buy Payment Request
            Buy.postPayment($window.productData.reference_code, paymentObj)
                .success(function(data) {
                    $scope.isLoading = false;
                    
                    try {
                        if(data.status == "success" && data.data != null) {
                            if(data.data.paymentObj.data.transfer != null && data.data.paymentObj.data.authurl != null) {
                                $scope.paymentObj = data.data;

                                $scope.isLoading = false;
                                $scope.view = 'auth';
                            }else if(data.data.paymentObj.data.transfer != undefined && data.data.paymentObj.data.transfer.flutterChargeResponseCode == "02") {
                                $scope.paymentObj = data.data;

                                $scope.isLoading = false;
                                $scope.view = 'otp';
                            }else if(data.data.paymentObj.data.flutterChargeResponseCode == "00") {
                                $scope.isLoading = false;
                                $scope.view = "successfull";
                                $scope.error = "";

                                return;
                            }
                        }else {
                            $scope.error = data.message;
                            $scope.isLoading = false;

                            return;
                        }
                    }catch(err) {
                        $scope.error = 'Something went wrong. Please try again.';
                        $scope.isLoading = false;

                        return;
                    }
                })
                .error(function() {
                    $scope.error = "Payment request failed. Please try again.";
                    $scope.isLoading = false;

                    return;
                }); 
        }

        $scope.verifyOtp = function() {
            $scope.error = "";
            $scope.isLoading = true;
            if($scope.paymentObj != null && $scope.paymentObj.invoice != null && $scope.paymentObj.paymentObj != null && $scope.paymentObj.paymentObj.data.transfer.flutterChargeResponseCode == "02") {
                //Verify Transaction
                var invoiceHash = $scope.paymentObj.invoice.reference_code;

                Buy.verifyOtp(invoiceHash, {
                    otp: $scope.paymentData.card.otp,
                    transactionRef: $scope.paymentObj.paymentObj.data.transfer.flutterChargeReference
                })
                    .success(function(data) {
                        if(data.status == "success") {
                            $scope.isLoading = false;
                            $scope.view = "successfull";
                            $scope.error = "";

                            return;
                        }else {
                            $scope.isLoading = false;
                            $scope.error = data.message;
                            $scope.view = "otp";

                            return;
                        }
                    })
                    .error(function(data) {
                        $scope.isLoading = false;
                        $scope.error = "Failed to verify payment. Please try again.";
                        $scope.view = "otp";

                        return;
                    });
            }else {
                $scope.error = "Payment object not found. Please try again.";
                $scope.view = "failed";
                $scope.isLoading = false;

                return;
            }
        };

        $scope.validateCard = function() {
            $scope.error = "";
            $scope.isLoading = true;
            if($scope.paymentObj != null && $scope.paymentObj.paymentObj.status == "success" && $scope.paymentObj.paymentObj.data != null && $scope.paymentObj.paymentObj.data.transfer != null && $scope.paymentObj.paymentObj.data.authurl != null) {
                var authUrl = $scope.paymentObj.paymentObj.data.authurl;
                var authIframe = $('#authIframe');
                var doc = document.getElementById('authIframe').contentWindow.document;
                doc.open();
                doc.write($scope.paymentObj.paymentObj.data.responsehtml);
                doc.close();
                $('#authModal').modal('show');

                var iframeChecker = $interval(function() {
                    try {
                        var thesrc = document.getElementById("authIframe").contentWindow.location.href.replace(/[^\x00-\x7F]/g, "");
                        var spliturl = thesrc.split('/');
                        var doc = document.getElementById('authIframe').contentWindow.document;

                        if(spliturl[spliturl.length - 2] == "redirect" && doc.readyState  == 'complete') {
                            $interval.cancel(iframeChecker);
                            $('#authModal').modal('hide');

                            $scope.view = "verify";
                            //Verify Transaction
                            var invoiceHash = $scope.paymentObj.invoice.reference_code;

                            Buy.verify(invoiceHash)
                                .success(function(data) {
                                    if(data.status == "success") {
                                        $scope.isLoading = false;
                                        $scope.view = "successfull";
                                        $scope.error = "";
                                        
                                        return;
                                    }else {
                                        $scope.isLoading = false;
                                        $scope.error = data.message;
                                        $scope.view = "failed";

                                        return;
                                    }
                                })
                                .error(function(data) {
                                    $scope.isLoading = false;
                                    $scope.error = "Failed to verify payment. Try reloading this page.";
                                    $scope.view = "failed";

                                    return;
                                });
                        }
                    } catch (err) {
                        // Do Nothing
                    }
                }, 500);
            }else {
                $scope.error = "Invalid request. Please try again.";
                $scope.view = "failed";
                $scope.isLoading = false;

                return;
            }
        };
    })

    .factory('Config', function ($location) {
        // create a new obj instance
        var configFactory = {};

        configFactory.apiUrl = $location.protocol() + "://" + $location.host();

        // return entire configFactory obj
        return configFactory;
    })

    .factory('Payments', function(Config, $http) {
        var paymentsFactory = {};

        paymentsFactory.post = function(invoiceId, data) {
            return $http.post(Config.apiUrl + '/pay/'+invoiceId, data);
        };

        paymentsFactory.postBank = function(invoiceId, data) {
            return $http.post(Config.apiUrl + '/pay/bank/'+invoiceId, data);
        };

        paymentsFactory.verify = function(invoiceId, payBy) {
            if(payBy && payBy == 'bank') 
                return $http.get(Config.apiUrl + '/pay/bank/verify/'+invoiceId);
            else
                return $http.get(Config.apiUrl + '/pay/verify/'+invoiceId);
        };

        paymentsFactory.verifyOtp = function(invoiceId, data, payBy) {
            if(payBy && payBy == 'bank') 
                return $http.post(Config.apiUrl + '/pay/bank/verifyOtp/'+invoiceId, data);
            else
                return $http.post(Config.apiUrl + '/pay/verifyOtp/'+invoiceId, data);
        };

        return paymentsFactory;
    })

    .factory('Buy', function(Config, $http) {
        var buyFactory = {};

        buyFactory.getPlatformUser = function(platform, id) {
            return $http.get(Config.apiUrl + '/buy/platform-user/' + platform + '/' + id);
        }

        buyFactory.addAddress = function(data) {
            return $http.post(Config.apiUrl + '/buy/address', data);
        }

        buyFactory.addCard = function(data) {
            return $http.post(Config.apiUrl + '/buy/card', data);
        }

        buyFactory.postPayment = function(reference_code, data) {
            return $http.post(Config.apiUrl + '/buy/'+ reference_code, data);
        }

        buyFactory.verifyOtp = function(invoiceId, data) {
            return $http.post(Config.apiUrl + '/buy/verifyOtp/'+invoiceId, data);
        };

        buyFactory.verify = function(invoiceId, data) {
            return $http.get(Config.apiUrl + '/buy/verify/'+invoiceId);
        };

        return buyFactory;
    })

})();





