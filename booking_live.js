// erp5_monaco_editor_include: ../calendar.js calendar

/* VARIABLES */
var myCurrentNumberTravellers = 0;
var myCurrentArea = '';
var servicePriceSmsFollowUp;

var errorMessages = {
  numberOfApplicantsIsIncorrect:
    'The <b>number of applicants</b> has been entered incorrectly<br>',
  numberOfApplicantsIsRequired:
    'Mandatory Field. Please enter <b>a number of applicants</b><br>',
  numberOfApplicantsMustBeBetween1AndMax:
    'The <b>number of applicants</b> must be between 1 and ${max}<br>',
  termsAndConditionsRequired:
    'Mandatory Field. To proceed you must accept <b>the Capago Terms and Conditions</b><br>',
  centerNotSelected:
    'Mandatory Field. To proceed you must <b>select a visa application center</b><br>',
  formulaNotSelected:
    'Mandatory Field. To proceed you must <b>select a type of appointment</b>',
  travellerDetailsError:
    'Traveller ${traveller_index} : All fields are mandatory. To proceed you must <b>enter details</b><br>',
  /* "Applicant 1" in main block */
  travellerIndex: '<span>Applicant ${traveller_index}</span>',
  /* "Applicant 1" in the block to select SMS notifications */
  travellerIndexForSMSBloc:
    '<div class="traveller">Applicant ${traveller_index} :</div>',
  enableSMSFollowup:
    'Track my visa application via SMS : <span data-html="sms-follow-up">${price_sms_service}</span> <span data-html="currency">${currency_code}<span>',
  // "salutation" (Mr. Mme.)
  title: 'Title',
  lastName: 'Surname',
  firstName: 'First Name(s)',
  birthDay: 'Date of Birth',
  departureDate: 'Departure Date',
  passportNumber: 'Passport Number',
  purposeOfTravel: 'Purpose of travel',
  durationOfStay: 'Duration of stay',
  visaType: 'Visa Type',
  variation: 'Variation',
  checkList: 'Checklist',
  mainContact: '<br>Main contact',
  loading: 'Loading...',
  photosRequired:
    "Mandatory field. Please select one of the options for identity's photos<br>",
  insuranceRequired: 'Please select one of the options<br>',
  deliveryRequired: 'Please select one of the options<br>',
  phoneNumberRequired:
    'Mandatory Field. Please enter <b>a phone number</b><br>',
  idPhoto: '<div>ICAO Standard ID Photos</div>',
  beLinkedByInsuranceBroker:
    '<div>Linked with a selected<br>Insurance Broker</div>',
  doorToDoorDelivery: '<div>Door to Door Delivery</div>',
  trackMyApplicationViaSMS: '<div>Track my visa application<br>via SMS</div>',
  travellerNameMainContactForSMS:
    '<b>Applicant ${traveller_index} - Main contact : </b> ${social_title} ${traveller_name}',
  travellerNameForSMS:
    '<b>Applicant ${traveller_index} : </b> ${social_title} ${traveller_name}',

  invoiceAddressedToCompany: '<div>Invoice addressed to a company</div>',
  appointmentDateRequired: 'Mandatory Field. Please select <b>a date</b><br>',
  appointmentTimeNotSelected:
    'Mandatory Field. Please select <b>a time</b></b>',
  unexpectedErrorOccured: 'An error occurred. Please try again.',
  noSlotAvailableForThisDate: 'No availability for the requested date.',
  allFieldsAreMandatoryForDelivery:
    'All fields for delivery are mandatory. To proceed you must enter details<br>',
  allFieldsAreMandatoryForInvoice:
    'All fields for invoice are mandatory. To proceed you must enter details<br>',
  bookingQueueConditionsRequired:
    'To proceed you must accept <b>the conditions for deposit and waiting queue</b><br>',
};

var errorMessagesFr = {
  numberOfApplicantsIsIncorrect:
    "Le <b>nombre de personne</b> n'est pas valide<br>",
  numberOfApplicantsIsRequired:
    'Le <b>nombre de personne</b> est obgligatoire<br>',
  numberOfApplicantsMustBeBetween1AndMax:
    'Le <b>nombre de personne</b> doit être compris entre 1 et ${max} max<br>',
  termsAndConditionsRequired:
    'Les <b>conditions générales de ventes</b> sont obligatoires<br>',
  centerNotSelected: 'Vous devez <b>sélectionner un centre</b><br>',
  formulaNotSelected: 'Vous devez <b>sélectionner une formule</b>',
  travellerDetailsError:
    'Voyageur ${traveller_index} : Merci de modifier <b>les informations erronées</b><br>',
  travellerIndex: '<span>Voyageur ${traveller_index}</span>',
  travellerIndexForSMSBloc:
    '<div class="traveller">Voyageur ${traveller_index} :</div>',
  enableSMSFollowup:
    'Avoir le suivi de ce dossier par SMS : <span data-html="sms-follow-up">${price_sms_service}</span> <span data-html="currency">${currency_code}<span>',
  title: 'Titre',
  lastName: 'Nom',
  firstName: 'Prénom',
  birthDay: 'Date de naissance',
  departureDate: 'Date de départ',
  passportNumber: 'Numéro de passeport',
  purposeOfTravel: 'Objet du voyage',
  visaType: 'Type de visa',
  checkList: 'Checklist',
  mainContact: '<br>Contact principal',
  loading: 'Chargement...',
  photosRequired:
    "Merci de renseigner votre choix pour la prise des photos d'identités<br>",
  insuranceRequired:
    'Merci de renseigner si vous souhaitez être <b>mis en relation avec un assureur</b><br>',
  deliveryRequired:
    'Merci de sélectionner <b>le mode de délivrance</b> du passeport<br>',
  phoneNumberRequired:
    'Merci de remplir <b>le numéro de téléphone mobile</b> pour le suvi du dossier par sms<br>',
  idPhoto: "<div>Photos d'identité</div>",
  beLinkedByInsuranceBroker: '<div>Etre rappelé</div>',
  doorToDoorDelivery: '<div>Délivrance à domicile</div>',
  trackMyApplicationViaSMS: '<div>Suivi par SMS</div>',
  travellerNameMainContactForSMS:
    '<b>Voyageur ${traveller_index} - Contact principal : </b> ${social_title} ${traveller_name}',
  travellerNameForSMS:
    '<b>Voyageur ${traveller_index} : </b> ${social_title} ${traveller_name}',
  invoiceAddressedToCompany: '<div>Facture entreprise</div>',
  appointmentDateRequired: 'Merci de renseigner <b>une date valide</b><br>',
  appointmentTimeNotSelected:
    'Merci de sélectionner <b>une heure de rendez-vous</b>',
  unexpectedErrorOccured: "Une erreur s'est produite. Veuillez réessayer.",
  noSlotAvailableForThisDate:
    'Aucun créneaux horaires disponible à cette date.',
  allFieldsAreMandatoryForDelivery:
    'Tous les champs pour la livraison à domicile sont obligatoires. Pour continuer vous devez saisir toutes les informations.<br>',
  allFieldsAreMandatoryForInvoice:
    "Tous les champs pour la facture au nom d'une société sont obligatoires. Pour continuer vous devez saisir toutes les informations.<br>",
  bookingQueueConditionsRequired:
    "Merci de reconnaître la clause sur le prépaiement en file d'attente pour pouvoir continuer.",
};

if (!window['translationMessages']) {
  var translationMessages = lang === 'fr' ? errorMessagesFr : errorMessages;
}

/* CHECK ACTION AND METHOD */
var bookingForm = $('.booking-form');
var formUrl = bookingForm.attr('action');
var formMethod = bookingForm.attr('method');

/* CALL WEB SERVICE DATE & TIME */
/* CHECK FULL OR BANK HOLIDAYS */
var fullDaysArray = [];
var fullTimeArray;

/* CALL WEBSERVICES */
/* GLOBAL PARAMETERS */
var webServiceGlobalUrl = 'WebSite_getCapagoBookingSiteGlobalParameter';
var webServiceListUrl = 'WebSite_getApplicableServiceList';
var webServiceVisaUrl = 'WebSite_getApplicableVisaTypeList';
var webServiceDateUrl = 'WebSite_getUnavailableDayList';
var webServiceTimeUrl = 'WebSite_getAvailableAppointmentSlotList';
var webServiceSocialList = 'WebSite_getSocialTitleCategoryList';
var webVisaFileVariationList = 'WebSite_getVisaFileVariationCategoryList';

var myDataWebServiceGlobal;

function onPremiumFormulaSelected() {
  $('.premium-application-only').show();
  $('.standard-application-only').hide();
  if (myDataWebServiceGlobal.premium_includes_home_delivery) {
    $("input[name='delivery_visa'][value='home_delivery']").click()
  }
  if (myDataWebServiceGlobal.premium_includes_photo) {
    $("input[name='portrait'][value='yes_portrait']").click()
    $("input[name='portrait']").prop({"disabled": true})
  }
  if (myDataWebServiceGlobal.premium_includes_sms) {
    $("input[name='follow_sms']").click()
  }
}


function onStandardFormulaSelected() {
  $('.premium-application-only').hide();
  $('.standard-application-only').show();
  $("input[name='portrait']").prop({"disabled": false});
}


var booking = {
  /** @type CalendarController */
  calendar_controller: null,

  /* VALIDATION FORM */
  /* STEP 1 */

  step1: function() {
    $(
      '.booking fieldset[data-step="1"] .step-container-data .content .next-step a'
    ).click(function(e) {
      e.preventDefault();

      /* VARIABLES */
      var myContent = $(this).closest('.content');
      var messageError = '';
      var boolError = 0;

      var responseMessage = myContent.find('.error-message');

      /* INPUTS */
      var myNumberOfTravellers = myContent.find(
        'input[type="text"][name="nb_travellers"]'
      );
      var myCgv = myContent.find('input[type="checkbox"][name="cgv"]');
      var myArea = myContent.find('input[type="radio"][name="area"]');
      var myFormula = myContent.find('input[type="radio"][name="formula"]');

      /* NUMBER OF TRAVELLERS */
      /* CHECK IF IS NUMBER OR NOT EMPTY */
      if (isNaN(myNumberOfTravellers.val())) {
        messageError += translationMessages.numberOfApplicantsIsIncorrect;
        boolError = 1;
        myNumberOfTravellers.addClass('error');
      } else if (myNumberOfTravellers.val() === '') {
        messageError += translationMessages.numberOfApplicantsIsRequired;
        boolError = 1;
        myNumberOfTravellers.addClass('error');
      } else if (
        myNumberOfTravellers.val() === 0 ||
        myNumberOfTravellers.val() > myDataWebServiceGlobal.max_travellers_per_group
      ) {
        messageError +=
          translationMessages.numberOfApplicantsMustBeBetween1AndMax.replace(
            "${max}",
            myDataWebServiceGlobal.max_travellers_per_group
          );
        boolError = 1;
        myNumberOfTravellers.addClass('error');
      } else {
        myNumberOfTravellers.removeClass('error');
      }

      /* CGV */
      /* CHECK IF INPUT CHECKBOX IS CHECKED */
      if (!myCgv.is(':checked')) {
        messageError += translationMessages.termsAndConditionsRequired;
        boolError = 1;
        myCgv.addClass('error');
      } else {
        myCgv.removeClass('error');
      }

      /* AREA */
      /* CHECK IF INPUT RADIO IS CHECKED */
      if (!myArea.is(':checked')) {
        messageError += translationMessages.centerNotSelected;
        boolError = 1;
        myArea.addClass('error');
      } else {
        myArea.removeClass('error');
      }

      /* FORMULA */
      /* CHECK IF INPUT RADIO IS CHECKED */
      if (!myFormula.is(':checked')) {
        messageError += translationMessages.formulaNotSelected;
        boolError = 1;
        myFormula.addClass('error');
      } else {
        myFormula.removeClass('error');
      }

      /* SUBMIT : CHECK IF ERROR */
      if (boolError == 1) {
        /* SET ERROR MESSAGE */
        responseMessage.html(messageError);

        /* CALL FUNCTIONS */
        booking.border();
      } else {
        /* REMOVE ERROR MESSAGE */
        responseMessage.html('');

        /* CALL FUNCTIONS FOR FORM */
        /* ADD TRAVELLERS */
        booking.addTravellersData(
          myNumberOfTravellers.val(),
          myArea.filter(':checked').val()
        );

        /* SHOW MORE PREMIUM IF NOT SELECTED */
        if (myFormula.filter(':checked').val() === 'standard') {
          $(
            'fieldset.step-container[data-step="3"] .step-container-data .bloc.premium'
          ).removeClass('hide');
          $(
            'fieldset.step-container[data-step="3"] .step-container-data .bloc.premium .content-bloc-premium .field-bloc-premium input'
          ).prop('checked', false);
        } else {
          $(
            'fieldset.step-container[data-step="3"] .step-container-data .bloc.premium'
          ).addClass('hide');
        }

        /* UPDATE PLACEHOLER FOR SMS */
        $(
          'fieldset.step-container[data-step="3"] .step-container-data .bloc.documents input[name="nb_travellers_portrait"]'
        ).val(myNumberOfTravellers.val());

        /* CALL FUNCTIONS FOR DESIGN */
        /* INIT BORDER, SELECT */
        booking.border();
        booking.isSelect();

        /* ADD DATA TO SUMMARY */
        if (lang === 'fr') {
          // TODO: this needs rewrite for better translation.
          $(
            '.booking fieldset[data-step="1"] .step-container-summary > div > p'
          )
            .find('.nb_travellers')
            .html(myNumberOfTravellers.val() + ' voyageur(s)');
          $(
            '.booking fieldset[data-step="1"] .step-container-summary > div > p'
          )
            .find('.name_area')
            .html('centre de ' + myArea.filter(':checked').data('name-area'));
          if (myFormula.filter(':checked').val() === 'premium') {
            $(
              '.booking fieldset[data-step="1"] .step-container-summary > div > p'
            )
              .find('.name_zone')
              .html('zone platinum');
            $(
              '.booking fieldset[data-step="3"] .step-container-summary > div > p'
            )
              .find('span')
              .html('de profiter de notre <strong>Service Platinum</strong>');
          } else {
            $(
              '.booking fieldset[data-step="1"] .step-container-summary > div > p'
            )
              .find('.name_zone')
              .html('zone standard');
            $(
              '.booking fieldset[data-step="3"] .step-container-summary > div > p'
            )
              .find('span')
              .html("d'être reçu <strong>dans la zone Classique</strong>");
          }
        } else {
          $(
            '.booking fieldset[data-step="1"] .step-container-summary > div > p'
          )
            .find('.nb_travellers')
            .html(myNumberOfTravellers.val() + ' applicant(s)');
          $(
            '.booking fieldset[data-step="1"] .step-container-summary > div > p'
          )
            .find('.name_area')
            .html(
              myArea.filter(':checked').data('name-area') +
                ' visa application center'
            );

          if (myFormula.filter(':checked').val() === 'premium') {
            $(
              '.booking fieldset[data-step="3"] .step-container-summary > div > p'
            )
              .find('span')
              .html('<strong>Platinum service</strong>');
            $(
              '.booking fieldset[data-step="1"] .step-container-summary > div > p'
            )
              .find('.name_zone')
              .html('platinum service');
            onPremiumFormulaSelected();
          } else {
            $(
              '.booking fieldset[data-step="3"] .step-container-summary > div > p'
            )
              .find('span')
              .html('<strong>Standard section</strong>');
            $(
              '.booking fieldset[data-step="1"] .step-container-summary > div > p'
            )
              .find('.name_zone')
              .html('standard section');
            onStandardFormulaSelected();
          }
        }

        /* SHOW NEXT STEP */
        /* MODULATE TIME WITH TRAVELLERS NUMBERS */
        booking.isValidateStep(
          myContent,
          1800,
          myNumberOfTravellers.val() * 1800
        );
      }
    });
  },

  step2: function() {
    $(
      '.booking fieldset[data-step="2"] .step-container-data .content .next-step a'
    ).click(function(e) {
      e.preventDefault();

      /* VARIABLES */
      var myContent = $(this).closest('.content');
      var messageError = '';
      var boolError;
      var dataTraveller = new Array(2);

      var submit = myContent.find('.next-step a');
      var submitContent = $(submit).text();
      var responseMessage = myContent.find('.error-message');

      boolError = 0;

      /* CHECK ALL INPUT FOR EACH TRAVELLER */
      for (var i = 1; i <= myContent.find('.traveller-details').length; i++) {
        boolErrorMessage = 0;

        /* INPUTS */
        var myTitle = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="title"]')
          .find('option:selected');
        var myLastName = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="lastname"] > input[type="text"]');
        var myFirstName = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="firstname"] > input[type="text"]');
        var myBirthDay = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="birth"] > .selectric-day')
          .find('option:selected');
        var myBirthMonth = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="birth"] > .selectric-month')
          .find('option:selected');
        var myBirthYear = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="birth"] > .selectric-year')
          .find('option:selected');
        var myDepartureDateDay = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="departure_date"] > .selectric-day')
          .find('option:selected');
        var myDepartureDateMonth = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="departure_date"] > .selectric-month')
          .find('option:selected');
        var myDepartureDateYear = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="departure_date"] > .selectric-year')
          .find('option:selected');
        var myPhone = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="telephone"] > input[type="text"]');
        var myEmail = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="email"] > input[type="text"]');
        var myEmailConfirm = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="confirm"] > input[type="text"]');
        var myPassport = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="passport"] > input[type="text"]');
        var myVisaDuration = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="visa_stay_duration"]')
          .find('option:selected');
        var myType = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="type"]')
          .find('option:selected');
        var myPrecision1 = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="precision1"]')
          .find('option:selected');
        var myPrecision2 = myContent
          .find('.traveller-details')
          .eq(i - 1)
          .find('div[data-input="precision2"]')
          .find('option:selected');

        dataTraveller[i - 1] = [
          myTitle.text(),
          myFirstName.val() + ' ' + myLastName.val()
        ];

        if (myTitle.val() === '') {
          boolError = 1;
          boolErrorMessage = 1;
          myTitle
            .closest('.selectric-wrapper')
            .find('.selectric')
            .addClass('error');
        } else {
          myTitle
            .closest('.selectric-wrapper')
            .find('.selectric')
            .removeClass('error');
        }

        if (myLastName.val() === '') {
          boolError = 1;
          boolErrorMessage = 1;
          myLastName.addClass('error');
        } else {
          myLastName.removeClass('error');
        }

        if (myFirstName.val() === '') {
          boolError = 1;
          boolErrorMessage = 1;
          myFirstName.addClass('error');
        } else {
          myFirstName.removeClass('error');
        }

        if (myBirthDay.val() === '') {
          boolError = 1;
          boolErrorMessage = 1;
          myBirthDay
            .closest('.selectric-wrapper')
            .find('.selectric')
            .addClass('error');
        } else {
          myBirthDay
            .closest('.selectric-wrapper')
            .find('.selectric')
            .removeClass('error');
        }

        if (myBirthMonth.val() === '') {
          boolError = 1;
          boolErrorMessage = 1;
          myBirthMonth
            .closest('.selectric-wrapper')
            .find('.selectric')
            .addClass('error');
        } else {
          myBirthMonth
            .closest('.selectric-wrapper')
            .find('.selectric')
            .removeClass('error');
        }

        if (myBirthYear.val() === '') {
          boolError = 1;
          boolErrorMessage = 1;
          myBirthYear
            .closest('.selectric-wrapper')
            .find('.selectric')
            .addClass('error');
        } else {
          myBirthYear
            .closest('.selectric-wrapper')
            .find('.selectric')
            .removeClass('error');
        }

        if (myDepartureDateDay.val() === '') {
          boolError = 1;
          boolErrorMessage = 1;
          myDepartureDateDay
            .closest('.selectric-wrapper')
            .find('.selectric')
            .addClass('error');
        } else {
          myDepartureDateDay
            .closest('.selectric-wrapper')
            .find('.selectric')
            .removeClass('error');
        }

        if (myDepartureDateMonth.val() === '') {
          boolError = 1;
          boolErrorMessage = 1;
          myDepartureDateMonth
            .closest('.selectric-wrapper')
            .find('.selectric')
            .addClass('error');
        } else {
          myDepartureDateMonth
            .closest('.selectric-wrapper')
            .find('.selectric')
            .removeClass('error');
        }

        if (myDepartureDateYear.val() === '') {
          boolError = 1;
          boolErrorMessage = 1;
          myDepartureDateYear
            .closest('.selectric-wrapper')
            .find('.selectric')
            .addClass('error');
        } else {
          myDepartureDateYear
            .closest('.selectric-wrapper')
            .find('.selectric')
            .removeClass('error');
        }

        /* CHECK EMAIL ONLY ON THE FIRST TRAVELLER (MAIN TRAVELLER) */
        if (myPhone.length) {
          if (myPhone.val() === '') {
            boolError = 1;
            boolErrorMessage = 1;
            myPhone.addClass('error');
          } else if (
            !booking.isValidPhoneNumber(expPhoneNumber, myPhone.val())
          ) {
            boolError = 1;
            boolErrorMessage = 1;
            myPhone.addClass('error');
          } else {
            myPhone.removeClass('error');
          }
        }

        if (myEmail.length) {
          if (myEmail.val() === myEmailConfirm.val()) {
            myEmail.removeClass('error');
            myEmailConfirm.removeClass('error');
            if (booking.isValidEmail(myEmail.val())) {
              myEmail.removeClass('error');
            } else {
              boolError = 1;
              boolErrorMessage = 1;
              myEmail.addClass('error');
            }
          } else {
            boolError = 1;
            boolErrorMessage = 1;
            myEmailConfirm.addClass('error');
          }
        }

        if (myPassport.val() === '') {
          boolError = 1;
          boolErrorMessage = 1;
          myPassport.addClass('error');
        } else {
          if (!(/^[a-zA-Z0-9]+$/).test(myPassport.val())) {
            boolError = 1;
            boolErrorMessage = 1;
            myPassport.addClass('error');
          } else {
            myPassport.removeClass('error');
          }
        }

        if (myType.val() === '') {
          boolError = 1;
          boolErrorMessage = 1;
          myType
            .closest('.selectric-wrapper')
            .find('.selectric')
            .addClass('error');
        } else {
          myType
            .closest('.selectric-wrapper')
            .find('.selectric')
            .removeClass('error');
        }

        if (myVisaDuration.val() === '') {
          boolError = 1;
          boolErrorMessage = 1;
          myVisaDuration
            .closest('.selectric-wrapper')
            .find('.selectric')
            .addClass('error');
        } else {
          myVisaDuration
            .closest('.selectric-wrapper')
            .find('.selectric')
            .removeClass('error');
        }

        if (myPrecision1.val() === '') {
          boolError = 1;
          boolErrorMessage = 1;
          myPrecision1
            .closest('.selectric-wrapper')
            .find('.selectric')
            .addClass('error');
        } else {
          myPrecision1
            .closest('.selectric-wrapper')
            .find('.selectric')
            .removeClass('error');
        }

        if (myPrecision2.val() === '') {
          boolError = 1;
          boolErrorMessage = 1;
          myPrecision2
            .closest('.selectric-wrapper')
            .find('.selectric')
            .addClass('error');
        } else {
          myPrecision2
            .closest('.selectric-wrapper')
            .find('.selectric')
            .removeClass('error');
        }

        /* PRE-CHECK IF ERRORS */
        if (boolErrorMessage === 1) {
          messageError += translationMessages.travellerDetailsError.replace(
            '${traveller_index}',
            '' + i
          );
        }

        /* WHEN FOREACH IS FINISHED */
        if (i === myContent.find('.traveller-details').size()) {
          /* SUBMIT : CHECK IF ERRORS */
          if (boolError === 1) {
            /* SET ERROR MESSAGE */
            responseMessage.html(messageError);
          } else {
            /* REMOVE ERROR MESSAGE */
            responseMessage.html('');

            /* CALL FUNCTIONS FOR FORM */
            /* ADD TRAVELLERS FOR SMS*/
            booking.addTravellersSms(dataTraveller);

            var htmlTraveller = '';
            var isChecked = 0;

            /* CONSTRUCT HTML FOR SUMMARY */
            /* CHECK ALL INPUT FOR EACH TRAVELLER */
            for (
              var v = 1;
              v <= myContent.find('.traveller-details').length;
              v++
            ) {
              htmlTraveller += '<div>';
              htmlTraveller += '<div>';
              htmlTraveller +=
                '<img class="icons icon-Circled-User-Male" src="../img/icons/circled-user-male-' +
                colorHexa +
                '.svg">';
              htmlTraveller += '<div>';

              /* INDEX */
              htmlTraveller += translationMessages.travellerIndex.replace(
                '${traveller_index}',
                '' + v
              );

              if (v === 1) {
                htmlTraveller += translationMessages.mainContact;
              }
              htmlTraveller += '</div>';
              htmlTraveller += '</div>';
              htmlTraveller += '<div class="last">';
              htmlTraveller += '<div>';

              /* TITLE */
              if (
                $('.traveller-details')
                  .eq(v - 1)
                  .find(
                    '.traveller-details-form div[data-input="title"] select option:selected'
                  )
                  .text() === 'Mrs'
              ) {
                htmlTraveller += 'M<span class="abbreviation">rs</span>';
              } else if (
                $('.traveller-details')
                  .eq(v - 1)
                  .find(
                    '.traveller-details-form div[data-input="title"] select option:selected'
                  )
                  .text() === 'Mme'
              ) {
                htmlTraveller += 'M<span class="abbreviation">me</span>';
              } else if (
                $('.traveller-details')
                  .eq(v - 1)
                  .find(
                    '.traveller-details-form div[data-input="title"] select option:selected'
                  )
                  .text() === 'Mlle'
              ) {
                htmlTraveller += 'M<span class="abbreviation">lle</span>';
              } else {
                htmlTraveller +=
                  $('.traveller-details')
                    .eq(v - 1)
                    .find(
                      '.traveller-details-form div[data-input="title"] select option:selected'
                    )
                    .text() + ' ';
              }

              /* FIRSTNAME, LASTNAME AND TELEPHONE */
              htmlTraveller +=
                $('.traveller-details')
                  .eq(v - 1)
                  .find(
                    '.traveller-details-form div[data-input="firstname"] input'
                  )
                  .val() +
                '<br>' +
                $('.traveller-details')
                  .eq(v - 1)
                  .find(
                    '.traveller-details-form div[data-input="lastname"] input'
                  )
                  .val()
                  .toUpperCase() +
                '<br>';
              if (v === 1) {
                htmlTraveller +=
                  $('.traveller-details')
                    .eq(v - 1)
                    .find(
                      '.traveller-details-form div[data-input="telephone"] input'
                    )
                    .val() + '<br>';
              }
              htmlTraveller += '</div>';
              htmlTraveller += '<div>';

              /* EMAIL */
              if (v === 1) {
                htmlTraveller +=
                  $('.traveller-details')
                    .eq(v - 1)
                    .find(
                      '.traveller-details-form div[data-input="email"] input'
                    )
                    .val() + '<br>';
              }

              /* DATE OF BIRTH */
              htmlTraveller +=
                $('.traveller-details')
                  .eq(v - 1)
                  .find(
                    '.traveller-details-form div[data-input="birth"] select[name="day_birth_traveller_' +
                      v +
                      '"] option:selected'
                  )
                  .val() +
                '/' +
                $('.traveller-details')
                  .eq(v - 1)
                  .find(
                    '.traveller-details-form div[data-input="birth"] select[name="month_birth_traveller_' +
                      v +
                      '"] option:selected'
                  )
                  .val() +
                '/' +
                $('.traveller-details')
                  .eq(v - 1)
                  .find(
                    '.traveller-details-form div[data-input="birth"] select[name="year_birth_traveller_' +
                      v +
                      '"] option:selected'
                  )
                  .val() +
                '<br>' +
                $('.traveller-details')
                  .eq(v - 1)
                  .find(
                    '.traveller-details-form div[data-input="passport"] input'
                  )
                  .val();
              htmlTraveller += '</div>';
              htmlTraveller += '<div class="last">';

              /* TYPE OF VISA, PRECISION 1 AND PRECISION 2 */
              htmlTraveller +=
                $('.traveller-details')
                  .eq(v - 1)
                  .find(
                    '.traveller-details-form div[data-input="type"] select option:selected'
                  )
                  .text() +
                ', ' +
                $('.traveller-details')
                  .eq(v - 1)
                  .find(
                    '.traveller-details-form div[data-input="precision1"] select option:selected'
                  )
                  .text() +
                ', ' +
                $('.traveller-details')
                  .eq(v - 1)
                  .find(
                    '.traveller-details-form div[data-input="precision2"] select option:selected'
                  )
                  .text();

               htmlTraveller += "<br>"
               htmlTraveller +=
                $('.traveller-details')
                  .eq(v - 1)
                  .find(
                    '.traveller-details-form div[data-input="departure_date"] select[name="day_departure_date_traveller_' +
                      v +
                      '"] option:selected'
                  )
                  .val() +
                '/' +
                $('.traveller-details')
                  .eq(v - 1)
                  .find(
                    '.traveller-details-form div[data-input="departure_date"] select[name="month_departure_date_traveller_' +
                      v +
                      '"] option:selected'
                  )
                  .val() +
                '/' +
                $('.traveller-details')
                  .eq(v - 1)
                  .find(
                    '.traveller-details-form div[data-input="departure_date"] select[name="year_departure_date_traveller_' +
                      v +
                      '"] option:selected'
                  )
                  .val()

              htmlTraveller += '</div>';
              htmlTraveller += '</div>';
              htmlTraveller += '</div>';

              /* CHECK IF TRAVELLER HAS SMS FOLLOW UP */
              /* CHANGE DATA FORM SMS */
              var myCheckbox = $('.traveller-details')
                .eq(v - 1)
                .find(
                  '.traveller-details-header .field-wrapper input[type="checkbox"]'
                );

              if (myCheckbox.is(':checked')) {
                isChecked++;

                /* CHECK TRAVELLERS WITH SMS FOLLOW UP IN STEP 3 */
                $('fieldset[data-step="3"] .step-container-data .bloc.sms')
                  .find('input[name="follow_sms_traveller_' + v + '"]')
                  .prop('checked', true);
              }
            }

            $(
              '.booking fieldset[data-step="2"] .step-container-summary > div:first-child p'
            )
              .nextAll()
              .remove();
            $(
              '.booking fieldset[data-step="2"] .step-container-summary > div:first-child'
            ).append(htmlTraveller);

            /* SET VALUE FOR DELIVERY */
            $(
              '.bloc.delivery .delivery-details-form .field-wrapper select[name="title_delivery_contact"]'
            ).val(
              $(
                '.traveller-details:first .traveller-details-form .field-wrapper[data-input="title"] div.selectric p.label'
              )
                .text()
                .toLowerCase()
            );
            $(
              '.bloc.delivery .delivery-details-form .field-wrapper select[name="title_delivery_contact"]'
            ).selectric('refresh');
            $(
              '.bloc.delivery .delivery-details-form .field-wrapper input[name="lastname_delivery_contact"]'
            ).val(
              $(
                '.traveller-details-form .field-wrapper input[name="lastname_traveller_1"]'
              ).val()
            );
            $(
              '.bloc.delivery .delivery-details-form .field-wrapper input[name="firstname_delivery_contact"]'
            ).val(
              $(
                '.traveller-details-form .field-wrapper input[name="firstname_traveller_1"]'
              ).val()
            );

            /* SET VALUE MOBILE PHONE FOR TRACK MY APPLICATION VISA ONLY IF IT'S EMPTY*/
            if (
              !$(
                'fieldset[data-step="3"] .step-container-data .bloc.sms .field-wrapper input[name="sms_mobile"]'
              ).val().length
            ) {
              $(
                'fieldset[data-step="3"] .step-container-data .bloc.sms .field-wrapper input[name="sms_mobile"]'
              ).val(
                myContent
                  .find('.traveller-details')
                  .eq(0)
                  .find(
                    'div[data-input="telephone"] input[name="phone_traveller_1"]'
                  )
                  .val()
              );
            }

            /* SHOW OTHERS TRAVELLERS FOR SMS IN STEP 3 */
            var nbTravellersTotal = myContent.find('.traveller-details').length;

            if (isChecked >= 1) {
              $(
                'fieldset[data-step="3"] .step-container-data .bloc.sms .field-wrapper'
              ).removeClass('hide');
              $(
                'fieldset[data-step="3"] .step-container-data .bloc.sms .field-wrapper input[name="follow_sms"]'
              ).prop('checked', true);

              if (isChecked < nbTravellersTotal) {
                $('fieldset[data-step="3"] .step-container-data .bloc.sms')
                  .find('.others')
                  .removeClass('hide');
              }
            }

            /* SHOW NEXT STEP */
            /* MODULATE TIME WITH TRAVELLERS NUMBERS */
            booking.isValidateStep(myContent, 1800, 1800);
            booking.prepareCalendar();
          }
        }
      }
    });
  },

  step3: function() {
    $(
      '.booking fieldset[data-step="3"] .step-container-data .content .next-step a'
    ).click(function(e) {
      e.preventDefault();

      /* VARIABLES */
      var myContent = $(this).closest('.content');
      var messageError = '';
      var boolError = 0;
      var dataSmsTraveller = {};

      var responseMessage = myContent.find('.error-message');

      /* INPUTS */
      var myPhotosPortrait = myContent.find(
        'input[type="radio"][name="portrait"]'
      );
      var myTravellersPortrait = myContent.find(
        'input[type="radio"][name="travellers_portrait"]'
      );
      var myNumberTravellersPortrait = myContent.find(
        'input[type="text"][name="nb_travellers_portrait"]'
      );
      var myInsurance = myContent.find('input[type="radio"][name="relation"]');
      var myDeliveryVisa = myContent.find(
        'input[type="radio"][name="delivery_visa"]'
      );
      var myTitleDelivery = $('.bloc.delivery .delivery-details-form')
        .find('div[data-input="title"]')
        .find('option:selected');
      var myLastNameDelivery = $('.bloc.delivery .delivery-details-form').find(
        'div[data-input="lastname"] > input[type="text"]'
      );
      var myFirstNameDelivery = $('.bloc.delivery .delivery-details-form').find(
        'div[data-input="firstname"] > input[type="text"]'
      );
      var myAddressDelivery = $('.bloc.delivery .delivery-details-form').find(
        'div[data-input="address"] > input[type="text"]'
      );
      var myZipDelivery = $('.bloc.delivery .delivery-details-form').find(
        'div[data-input="zip"] > input[type="text"]'
      );
      var myCityDelivery = $('.bloc.delivery .delivery-details-form').find(
        'div[data-input="city"] > input[type="text"]'
      );
      var myFollowSms = myContent.find(
        'input[type="checkbox"][name="follow_sms"]'
      );
      var mySmsMobile = myContent.find('input[type="text"][name="sms_mobile"]');
      var myInvoiceEmail = myContent.find(
        'input[type="checkbox"][name="invoice_email"]'
      );

      var mySocietyInvoice = $('.bloc.invoice .delivery-details-form').find(
        'div[data-input="society"] > input[type="text"]'
      );
      var myTvaInvoice = $('.bloc.invoice .delivery-details-form').find(
        'div[data-input="tva"] > input[type="text"]'
      );
      var myAddressInvoice = $('.bloc.invoice .delivery-details-form').find(
        'div[data-input="address"] > input[type="text"]'
      );
      var myZipInvoice = $('.bloc.invoice .delivery-details-form').find(
        'div[data-input="zip"] > input[type="text"]'
      );
      var myCityInvoice = $('.bloc.invoice .delivery-details-form').find(
        'div[data-input="city"] > input[type="text"]'
      );

      if (myPhotosPortrait.length) {
        if (!myPhotosPortrait.is(':checked')) {
          messageError += translationMessages.photosRequired;
          boolError = 1;
          myPhotosPortrait.addClass('error');
        } else {
          myPhotosPortrait.removeClass('error');
        }
      }

      if (myInsurance.length) {
        if (!myInsurance.is(':checked')) {
          messageError += translationMessages.insuranceRequired;
          boolError = 1;
          myInsurance.addClass('error');
        } else {
          myInsurance.removeClass('error');
        }
      }

      if (myDeliveryVisa.length) {
        if (!myDeliveryVisa.is(':checked')) {
          messageError += translationMessages.deliveryRequired;
          boolError = 1;
          myDeliveryVisa.addClass('error');
        } else {
          myDeliveryVisa.removeClass('error');

          /* IF IS DELIVERY AT HOME */
          if (myDeliveryVisa.filter(':checked').val() === 'home_delivery') {
            if (myTitleDelivery.val() === '') {
              boolError = 1;
              myTitleDelivery
                .closest('.selectric-wrapper')
                .find('.selectric')
                .addClass('error');
            } else {
              myTitleDelivery
                .closest('.selectric-wrapper')
                .find('.selectric')
                .removeClass('error');
            }

            if (myLastNameDelivery.val() === '') {
              boolError = 1;
              myLastNameDelivery.addClass('error');
            } else {
              myLastNameDelivery.removeClass('error');
            }

            if (myFirstNameDelivery.val() === '') {
              boolError = 1;
              myFirstNameDelivery.addClass('error');
            } else {
              myFirstNameDelivery.removeClass('error');
            }

            if (myAddressDelivery.val() === '') {
              boolError = 1;
              myAddressDelivery.addClass('error');
            } else {
              myAddressDelivery.removeClass('error');
            }

            if (myZipDelivery.val() === '') {
              boolError = 1;
              myZipDelivery.addClass('error');
            } else {
              myZipDelivery.removeClass('error');
            }

            if (myCityDelivery.val() === '') {
              boolError = 1;
              myCityDelivery.addClass('error');
            } else {
              myCityDelivery.removeClass('error');
            }

            /* ERROR MESSAGE FOR DELIVERY */
            /* IF THERE ARE ERRORS */
            if (boolError) {
              messageError +=
                translationMessages.allFieldsAreMandatoryForDelivery;
            }
          } else {
            myTitleDelivery.removeClass('error');
            myLastNameDelivery.removeClass('error');
            myFirstNameDelivery.removeClass('error');
            myAddressDelivery.removeClass('error');
            myZipDelivery.removeClass('error');
            myCityDelivery.removeClass('error');
          }
        }
      }

      if (myFollowSms.length) {
        if (!myFollowSms.is(':checked')) {
          mySmsMobile.removeClass('error');
        } else {
          myFollowSms.removeClass('error');

          if (mySmsMobile.val() === '') {
            messageError += translationMessages.phoneNumberRequired;
            boolError = 1;
            mySmsMobile.addClass('error');
          } else {
            mySmsMobile.removeClass('error');
          }
        }
      }

      if (myInvoiceEmail.length) {
        if (!myInvoiceEmail.is(':checked')) {
          mySocietyInvoice.removeClass('error');
          myTvaInvoice.removeClass('error');
          myAddressInvoice.removeClass('error');
          myZipInvoice.removeClass('error');
          myCityInvoice.removeClass('error');
        } else {
          if (mySocietyInvoice.val() === '') {
            boolError = 1;
            mySocietyInvoice.addClass('error');
          } else {
            mySocietyInvoice.removeClass('error');
          }

          if (myTvaInvoice.val() === '') {
            boolError = 1;
            myTvaInvoice.addClass('error');
          } else {
            myTvaInvoice.removeClass('error');
          }

          if (myAddressInvoice.val() === '') {
            boolError = 1;
            myAddressInvoice.addClass('error');
          } else {
            myAddressInvoice.removeClass('error');
          }

          if (myZipInvoice.val() === '') {
            boolError = 1;
            myZipInvoice.addClass('error');
          } else {
            myZipInvoice.removeClass('error');
          }

          if (myCityInvoice.val() === '') {
            boolError = 1;
            myCityInvoice.addClass('error');
          } else {
            myCityInvoice.removeClass('error');
          }

          /* ERROR MESSAGE FOR DELIVERY */
          /* IF THERE ARE ERRORS */
          if (boolError) {
            messageError += translationMessages.allFieldsAreMandatoryForInvoice;
          }
        }
      }

      /* SUBMIT : CHECK IF ERROR */
      if (boolError == 1) {
        /* SET ERROR MESSAGE */
        responseMessage.html(messageError);

        /* CALL FUNCTIONS */
        booking.border();
      } else {
        /* REMOVE ERROR MESSAGE */
        responseMessage.html('');

        /* CALL FUNCTIONS */
        booking.border();

        /* CONSTRUCT HTML FOR SUMMARY */
        var htmlDocuments = '';
        var myBloc;

        /* CHECK IF HTML BLOC FOR DOCUMENTS EXIST */
        if ($('.bloc.documents').length) {
          myBloc = $('.bloc.documents');

          /* CHECK IF HTML BLOC FOR STANDARD ID PHOTOS EXIST */
          if (
            myBloc.find(
              '.document .content-bloc-documents .field-bloc-documents .field-wrapper-documents input[name="portrait"]'
            ).length
          ) {
            myInput = myBloc.find(
              '.document .content-bloc-documents .field-bloc-documents .field-wrapper-documents input[name="portrait"]'
            );

            if (myInput.filter(':checked').val() === 'yes_portrait') {
              htmlDocuments += '<div class="photos">';
              htmlDocuments +=
                '<img class="icons icon-Stack-of-Photos-Filled" src="../img/icons/stack-of-photos-' +
                colorHexa +
                '.svg">';

              htmlDocuments += translationMessages.idPhoto;
              htmlDocuments += '</div>';
            }
          }

          /* CHECK IF HTML BLOC FOR SCHEGEN TRAVEL INSURANCE EXIST */
          if (
            myBloc.find(
              '.document.insurance .content-bloc-documents .field-bloc-documents .field-wrapper-documents input[name="relation"]'
            ).length
          ) {
            myInput = myBloc.find(
              '.document.last .content-bloc-documents .field-bloc-documents .field-wrapper-documents input[name="relation"]'
            );

            if (myInput.filter(':checked').val() === 'yes_relation') {
              htmlDocuments += '<div class="callback">';
              htmlDocuments +=
                '<img class="icons icon-Callback" src="../img/icons/callback-' +
                colorHexa +
                '.svg">';

              htmlDocuments += translationMessages.beLinkedByInsuranceBroker;
              htmlDocuments += '</div>';
            }
          }
        }

        /* CHECK IF HTML BLOC FOR PASSPORT DELIVERY / COLLECTION EXIST */
        if ($('.bloc.passport').length) {
          myBloc = $('.bloc.passport');

          if (
            myBloc
              .find('.field-wrapper input[name="delivery_visa"]')
              .filter(':checked')
              .val() === 'home_delivery'
          ) {
            htmlDocuments += '<div class="delivery">';
            htmlDocuments +=
              '<img class="icons icon-Passport" src="../img/icons/passport-' +
              colorHexa +
              '.svg">';

            htmlDocuments += translationMessages.doorToDoorDelivery;
            htmlDocuments += '</div>';
          }
        }

        /* CHECK IF HTML BLOC FOR TRACK MY VISA APPLICATION VIA SMS EXIST */
        if ($('.bloc.sms').length) {
          myBloc = $('.bloc.sms');

          if (
            myBloc
              .find('.field-wrapper input[name="follow_sms"]')
              .is(':checked')
          ) {
            htmlDocuments += '<div class="sms">';
            htmlDocuments +=
              '<img class="icons icon-Sms" src="../img/icons/sms-' +
              colorHexa +
              '.svg">';

            htmlDocuments += translationMessages.trackMyApplicationViaSMS;

            htmlDocuments += '</div>';
          }
        }

        /* CHECK IF HTML BLOC FOR INVOICE EXIST */
        if ($('.bloc.invoice').length) {
          myBloc = $('.bloc.invoice');

          if (
            myBloc
              .find('.field-wrapper input[name="invoice_email"]')
              .is(':checked')
          ) {
            htmlDocuments += '<div class="invoice-society">';
            htmlDocuments +=
              '<img class="icons icon-Invoice" src="../img/icons/invoice-' +
              colorHexa +
              '.svg">';
            htmlDocuments += translationMessages.invoiceAddressedToCompany;
            htmlDocuments += '</div>';
          }
        }

        $(
          '.booking fieldset[data-step="3"] .step-container-summary > div:first-child > div'
        ).html(htmlDocuments);

        /* SHOW NEXT STEP */
        booking.isValidateStep(myContent, 1800);
      }
    });
  },

  step4: function() {
    $(
      '.booking fieldset[data-step="4"] .step-container-data .content .next-step a'
    ).click(function(e) {
      e.preventDefault();

      /* check recaptcha if exists */
      var recaptcha = document.querySelector(".g-recaptcha");
      if (recaptcha) {
        var response = recaptcha.querySelector('.g-recaptcha-response');
        if (response && response.value.trim() === ""){
          recaptcha.querySelector("iframe").style.border = '2px solid red';
          return;
        }
      }
      /* VARIABLES */
      var myContent = $(this).closest('.content');
      var messageError = '';
      var boolError = 0;

      var submit = myContent.find('.next-step a');
      var submitContent = $(submit).text();
      var responseMessage = myContent.find('.error-message');

      if (submit.data('submitted')) {
        boolError = 1;
      }

      /* INPUTS */
      var myDatePlanning = myContent.find('input[name="date_submit"]');
      var myDatePickatime = myContent.find('select[name="time"]');
      if (booking.choose_appointment_date && myDatePlanning.val() === '') {
        messageError += translationMessages.appointmentDateRequired;
        boolError = 1;
        myDatePlanning
          .closest('.field-wrapper')
          .find('#input_date_pickadate')
          .addClass('error');
      } else {
        myDatePlanning
          .closest('.field-wrapper')
          .find('#input_date_pickadate')
          .removeClass('error');
      }
      if (booking.choose_appointment_date && myDatePickatime.val() === '') {
        messageError += translationMessages.appointmentTimeNotSelected;
        boolError = 1;
        myDatePickatime
          .closest('.selectric-wrapper')
          .find('.selectric')
          .addClass('error');
      } else {
        myDatePickatime
          .closest('.selectric-wrapper')
          .find('.selectric')
          .removeClass('error');
      }

      if (!booking.choose_appointment_date &&
        $(".booking_queue_checkbox:checked").length !== $(".booking_queue_checkbox").length) {
        messageError += translationMessages.bookingQueueConditionsRequired;
        boolError = 1;
        $(".booking_queue_checkbox").addClass("error");
      } else {
        $(".booking_queue_checkbox").removeClass("error");
      }

      /* SUBMIT : CHECK IF ERROR */
      if (boolError == 1) {
        /* SET ERROR MESSAGE */
        responseMessage.html(messageError);

        /* CALL FUNCTIONS */
        booking.border();
      } else {
        /* REMOVE ERROR MESSAGE */
        responseMessage.html('');

        /* CALL FUNCTIONS */
        booking.border();

        /* SERIALIZE DATA FOR AJAX REQUEST */
        var serializeArray = $('.booking-form').serializeArray();
        // post "off" for renewal checkboxs when not checked, we want to make a difference between not posted because
        // the input is not in the page and not posted because the checkbox was not checked.
        $('input[type="checkbox"][name^="renewal_traveller_"]').each(function() {
            if (!this.checked) {
                serializeArray.push({ name: this.name, value: 'off' });
            }
        });
        /* The same behaviour to renewal_traveller should be applied
           to visa_file_variation_traveller_ */
        $('select[name^="visa_file_variation_traveller_"]').each(function () {
          if (!this.value) {
            var item = serializeArray.find(obj => obj.name === this.name);
            if (item) {
              item.value = 'primo_demand';
            } else {
              serializeArray.push({ name: this.name, value: 'primo_demand' });
            }
          }
        });

        $(submit)
          .text(BookingFormSendingButton)
          .data('submitted', 'true');

        $("input.error").removeClass("error");

        /* SEND FORM WITH AJAX REQUEST */
        $.ajax({
          url: formUrl,
          method: formMethod,
          data: $.param(serializeArray),
          dataType: 'text'
        })
          .done(function(data, status, xhr) {
            if (xhr.status === 201) {
              window.location.href = xhr.getResponseHeader('Location');
            } else {
              // Everything you want
              throw new Error('Unexpected result: ' + data);
            }
          })
          .fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Error occurred in processing your request:');
            console.error(jqXHR);
            console.error('Text status');
            console.error(textStatus);
            console.error('Error thrown');
            console.error(errorThrown);
            console.error('Server response');
            console.error(jqXHR.status);

            var htmlErrorList = '';

            if (
              jqXHR.status === 500 ||
              jqXHR.status === 503 ||
              jqXHR.status === 504
            ) {
              htmlErrorList = translationMessages.unexpectedErrorOccured;
            } else {
              var array = $.parseJSON(jqXHR.responseText);
              var errorList = array.form_validation_error_list;

              /* SHOW ERROR */
              $.each(errorList, function(index) {
                $.each(errorList[index], function(key, value) {
                  if (key === 'field_validation_error_description') {
                    htmlErrorList += value + '<br>';
                  }
                  if (key === 'field_name') {
                    $("input[name=" + value + "]").addClass("error");
                  }
                });
              });
            }

            // Set error message
            responseMessage
              .hide()
              .html(htmlErrorList)
              .fadeIn(200);
            // Revert button value
            $(submit)
              .text(submitContent)
              .data('submitted', '');
          });
      }
    });
  },

  /* OTHERS FUNCTIONS FOR FORM */
  isValidateStep: function(myContent, myDuration, myDurationDown) {
    var mySummaryHeight = myContent
      .closest('fieldset')
      .find('.step-container-summary')
      .outerHeight();
    $("body").addClass("booking-change-step-animating");

    /* SLIDE UP CURRENT STEP */
    myContent
      .closest('fieldset')
      .find('.container')
      .slideUp({
        duration: myDuration / 2,
        easing: 'easeOutCubic',
        start: function() {
          /* HIDE ALL EDIT BUTTON */
          $('.step-container-summary > div + div').animate(
            {
              opacity: 0
            },
            {
              duration: myDuration / 2,
              easing: 'easeOutCubic',
              done: function() {
                $('.step-container-summary > div + div').css(
                  'visibility',
                  'hidden'
                );
              }
            }
          );
        },
        done: function() {
          /* ADDCLASS ACTIVE CURRENT STEP*/
          $(this)
            .closest('fieldset')
            .prev('section.header')
            .find('.container .number')
            .addClass('active');

          /* SHOW/HIDE ELEMENTS */
          $(this)
            .find('.step-container-data')
            .hide();
          $(this)
            .find('.step-container-summary')
            .show();
          $(this)
            .find('.step-container-border')
            .height(mySummaryHeight);

          /* SLIDE DOWN CONTAINER */
          var rate = 250; // pixels per second
          var ms = (mySummaryHeight / rate) * 1000;

          $(this).slideDown({
            duration: ms,
            easing: 'linear',
            start: function() {
              /* VARIABLES */
              var myNextStep =
                parseInt(
                  '' +
                    $(this)
                      .closest('fieldset')
                      .data('step')
                ) + 1;

              /* REMOVE CLASS ACTIVE ON CURRENT STEP */
              $(this)
                .closest('fieldset')
                .prev('section.header')
                .removeClass('active');

              /* ADDCLASS SELECTED + ACTIVE NEXT STEP */
              $('fieldset.step-container[data-step="' + myNextStep + '"]')
                .prev('section.header')
                .addClass('selected')
                .addClass('active');
            },
            done: function() {
              /* VARIABLES */
              var myNextStep =
                parseInt(
                  '' +
                    $(this)
                      .closest('fieldset')
                      .data('step')
                ) + 1;

              /* REDEFINE MS FOR NEXT BLOC */
              ms =
                ($(
                  'fieldset.step-container[data-step="' + myNextStep + '"]'
                ).height() /
                  rate) *
                1000;

              /* SLIDE DOWN NEXT STEP */
              $(
                'fieldset.step-container[data-step="' + myNextStep + '"]'
              ).slideDown({
                duration: ms,
                easing: 'easeOutCubic',
                complete: function() {
                  $(window).trigger('resize');

                  /* SHOW EDIT BUTTON */
                  $('.step-container-summary > div + div')
                    .css('visibility', 'visible')
                    .animate(
                      {
                        opacity: 1
                      },
                      {
                        duration: myDuration / 2,
                        easing: 'easeOutCubic'
                      }
                    );
                    $("body").removeClass("booking-change-step-animating");
                }
              });

              /* SET VALUE (NOT ANIMATE) */
              $('fieldset.step-container[data-step="' + myNextStep + '"]')
                .find('.step-container-border')
                .height(
                  $('fieldset.step-container[data-step="' + myNextStep + '"]')
                    .find('.step-container-data .content')
                    .outerHeight()
                );

              /* INIT SEPARATOR */
              booking.separator((animate = 1));

              /* INIT BLOC DOCUMENTS */
              booking.documents();
            }
          });
        }
      });
  },

  isEditStep: function() {
    $('.step-container-summary div + div a').click(function(e) {
      e.preventDefault();

      var myContent = $(this).closest('fieldset');
      var myDataHeight = myContent.find('.step-container-data').outerHeight();
      var myHead = myContent.prev('.header');

      /* DEFINE CURRENT NUMBER OF TRAVELLERS */
      myCurrentNumberTravellers = parseInt(
        '' +
          $(
            '.booking fieldset[data-step="1"] .step-container-data .content .bloc .field-wrapper input[name="nb_travellers"]'
          ).val()
      );

      /* DEFINE CURRENT AREA */
      myCurrentArea =
        '' +
        $(
          '.booking fieldset[data-step="1"] .step-container-data .content .bloc[data-bloc="area"] input[name="area"]:checked'
        ).val();

      /* SLIDE UP ALL STEP */
      myHead.nextAll('fieldset.step-container').slideUp({
        duration: 1800 / 2,
        easing: 'easeOutCubic',
        done: function() {
          /* REMOVE CLASS SELECTED + ACTIVE ON ALL STEP */
          myHead
            .nextAll('.header')
            .removeClass('selected')
            .removeClass('active');
          myHead
            .nextAll('.header')
            .find('.container .number')
            .removeClass('active');

          myHead
            .nextAll('fieldset.step-container')
            .find('.step-container-summary')
            .hide();
          myHead
            .nextAll('fieldset.step-container')
            .find('.step-container-data')
            .show();

          /* SHOW/HIDE ELEMENTS */
          myContent.find('.step-container-summary div + div').css('opacity', 0);
          myContent.find('.step-container-summary').hide();
          myContent.find('.step-container-data').show();
          myContent.find('.step-container-border').height(myDataHeight);

          /* SLIDE DOWN CONTAINER */
          myContent.slideDown({
            duration: 1800 / 2,
            start: function() {
              /* REMOVECLASS SELECTED + ACTIVE */
              myHead.find('.container .number').removeClass('active');

              /* INIT SEPARATOR */
              booking.separator((animate = 1));

              /* INIT BLOC DOCUMENTS */
              booking.documents();
            }
          });
        }
      });
    });
  },

  isNumber: function() {
    $('input[name="nb_travellers"]').keypress(function(e) {
      if (
        e.which != 8 &&
        (isNaN(String.fromCharCode(e.which)) || $(this).val().length >= 2)
      ) {
        e.preventDefault();
      }
    });

    $('input[name="nb_travellers"]').keyup(function(e) {
      if ($('input[name="nb_travellers"]').val() < 0) {
        $('input[name="nb_travellers"]').val(0);
      }

      if ($('input[name="nb_travellers"]').val() > 50) {
        $('input[name="nb_travellers"]').val(50);
      }

      /* SHOW/HIDE MESSAGE */
      if ($('input[name="nb_travellers"]').val() > myDataWebServiceGlobal.max_travellers_per_group) {
        $('input[name="nb_travellers"]')
          .next('div')
          .show();
      } else {
        $('input[name="nb_travellers"]')
          .next('div')
          .hide();
      }
    });
  },

  isValidEmail: function(email) {
    var addressCheck = new RegExp(
      /^[_\.0-9a-zA-Z\-]+@([0-9a-zA-Z][0-9a-zA-Z\-]+\.)+[a-zA-Z]{2,6}$/i
    );
    return addressCheck.test(email);
  },

  isValidPhoneNumber: function(expReg, numMatch) {
    var permittedChars = expReg;
    permittedChars = "'" + permittedChars + "'";

    var flags = 'gi';
    var strFilterRegEx = new RegExp(eval(permittedChars), flags);
    return strFilterRegEx.test(numMatch);
  },

  isSelect: function() {
    $('.booking .field-wrapper select').selectric({
      disableOnMobile: false
    });
  },

  isSms: function() {
    $(document).on(
      'change',
      'fieldset[data-step="3"] .step-container-data .bloc.sms .others input[type="checkbox"]',
      function() {
        var myElem = $(this);
        var myIndex = myElem.closest('.field-wrapper').index();

        $('fieldset[data-step="2"] .step-container-data .traveller-details')
          .eq(myIndex - 1)
          .find('.traveller-details-header .field-wrapper input')
          .trigger('click');
      }
    );
  },

  pickadate: function() {
    /* SET DATEPICKER */
    $('.datepicker_date').pickadate({
      /* DROPDOWN SELECTORS */
      selectYears: false,
      selectMonths: false,

      firstDay: 1,

      /* DATE LIMITS */
      min: +1,

      /* CLOSE ON A USER ACTION */
      closeOnSelect: true,
      closeOnClear: false,

      formatSubmit: 'yyyy-mm-dd',

      /* EVENTS */
      onStart: function() {
        $('input[type="hidden"][name="date_submit"]').val('');
      },

      onSet: function() {
        /* CALL FUNCTION SHOWPICKADATEFULL */
        booking.showPickadateFull(fullDaysArray);
      },

      onOpen: function() {
        /* HIDE AM/PM & DATA TIME*/
        $(
          'fieldset.step-container[data-step="4"] .step-container-data .planning .field-wrapper:nth-of-type(2), fieldset.step-container[data-step="4"] .step-container-data .planning .field-wrapper:nth-of-type(3)'
        ).hide();
        $(
          'fieldset.step-container[data-step="4"] .step-container-data .planning .field-wrapper:nth-of-type(2) input[name="date_pickadate"]'
        ).prop('checked', false);

        /* HIDE ERROR MESSAGE */
        $('.planning .field-message').hide();

        /* CALL FUNCTION SHOWPICKADATEFULL */
        booking.showPickadateFull(fullDaysArray);
      },

      onClose: function() {
        /* NEXT STEP ONLY IF A VALID DATE IS SELECTED */
        if ($('.planning input[name="date_submit"]').val()) {
          var myCenterId = $(
            'fieldset[data-step="1"] .step-container-data .bloc.last .area input[name="area"]:checked'
          ).val();
          var myFormula = $(
            'fieldset[data-step="1"] .step-container-data .bloc.choose .formula input[name="formula"]:checked'
          ).val();
          var myTravellerCount = $(
            'fieldset[data-step="1"] .step-container-data .bloc input[name="nb_travellers"]'
          ).val();
          var myDay =
            $('.planning input[name="date_submit"]').val() + 'T00:00:00Z';

          /* PUSH IN TIME PICKER */
          var pickerTime = $('.timepicker').selectric();
          /* HIDE AM/PM */
          $(
            'fieldset.step-container[data-step="4"] .step-container-data .planning .field-wrapper:nth-of-type(2)'
          ).hide();

          /* RESET TIMEPICKER */
          pickerTime.empty();
          pickerTime.append(
            $('<option disabled></option>').text(translationMessages.loading)
          );
          pickerTime.selectric('refresh');

          booking.calendar_controller.onDaySelected(myDay).then(function(data) {
            var slotDate, hours, slotText, $option;
            /* SHOW TIME IF DATA */
            if (data.available_slot_list.length) {
              /* SHOW AM/PM */
              $(
                'fieldset.step-container[data-step="4"] .step-container-data .planning .field-wrapper:nth-of-type(2)'
              ).show();

              pickerTime.empty();
              pickerTime.append('<option></option>');

              for (var i in data.available_slot_list) {
                if (data.available_slot_list.hasOwnProperty(i)) {
                  slotDate = new Date(data.available_slot_list[i]);
                  hours = slotDate.getUTCHours();
                  if (hours === 12) {
                    slotText =
                      '12:' +
                      ('0' + slotDate.getUTCMinutes()).slice(-2) +
                      ' PM';
                  } else {
                    if (hours === 0) {
                      slotText =
                        '12:' +
                        ('0' + slotDate.getUTCMinutes()).slice(-2) +
                        ' AM';
                    } else {
                      if (hours < 12) {
                        slotText =
                          '' +
                          hours +
                          ':' +
                          ('0' + slotDate.getUTCMinutes()).slice(-2) +
                          ' AM';
                      } else {
                        slotText =
                          '' +
                          (hours - 12) +
                          ':' +
                          ('0' + slotDate.getUTCMinutes()).slice(-2) +
                          ' PM';
                      }
                    }
                  }

                  $option = $('<option>')
                    .val(slotText)
                    .text(slotText);
                  pickerTime.append($option);
                }
              }

              /* SET ENABLE DATETIME */
              pickerTime.selectric('refresh');
            } else {
              $('.planning .field-message')
                .html(translationMessages.noSlotAvailableForThisDate)
                .show();
            }
          });
        }
      }
    });

    // "migrate" on the fly the HTML, we use to have a text element for name="time", we now want a select element.
    var legacyField = $('input.timepicker[type="text"]');
    if (legacyField.length) {
      console.debug('migrating timepicker', legacyField, 'to select');
      legacyField
        .parent()
        .append(
          $('<select id="input_time_pickatime" class="timepicker" name="time">')
        );
      legacyField.remove();
    }
  },
  /** Query web service to get (un)available days and populate the calendar */
  prepareCalendar: function() {
    var myCenterId =
      '' +
      $(
        'fieldset[data-step="1"] .step-container-data .bloc.last .area input[name="area"]:checked'
      ).val();
    var myFormula =
      '' +
      $(
        'fieldset[data-step="1"] .step-container-data .bloc.choose .formula input[name="formula"]:checked'
      ).val();
    var myTravellerCount = parseInt(
      '' +
      $(
        'fieldset[data-step="1"] .step-container-data .bloc input[name="nb_travellers"]'
      ).val()
    );

    /*
     Before calling available days web service, disable the calendar. We'll re-enable it once
     we get the result from web service.
    */
    if ($('.datepicker_date').length) {
      $('.datepicker_date')
        .hide()
        .val(translationMessages.loading);
    }
    if (myFormula === 'premium' || myFormula == 'standard') {
      /** @type {VisaFile[]} */
      let visa_file_list = [];
      for (var i = 1; i <= 10; i++) {
        let precision = $('#precision1_traveller_' + i);
        let renewal = $('#renewal_traveller_' + i);
        let visa_file_variation = $('#visa_file_variation_traveller_' + i).val();

        if (precision.val()) {
          if (!visa_file_variation) {
            /* For renewal, we tolerate a checkbox and a select with option value="true" */
            visa_file_variation = renewal.length === 0
              ? null
              : (renewal.is(':checked') || renewal.val() === "true")
                ? 'renewal'
                : 'primo_demand';
          }
          visa_file_list.push({
            resource_id: $('#type_visa_traveller_' + i).val(),
            variation_id: precision.val(),
            visa_file_variation
          });
        }
      }
      $('.choose_appointment_date').hide();
      $('.no_choose_appointment_date').hide();
      booking.calendar_controller
        .update({
          center: myCenterId,
          formula: myFormula,
          visa_file_list: visa_file_list
        })
        .then(function (data) {
          /* GET DATA FOR WEB SERVICE LIST */
          var i,
            firstDay = new Date(data.first_day),
            datePickDate = new Date(data.last_day);

          // reset full days
          fullDaysArray = [];

          if (data.expected_week_count_before_appointment) {
            $(
              '[data-html="expected_week_count_before_appointment"]'
            ).text(data.expected_week_count_before_appointment);
          }
          booking.choose_appointment_date = data.choose_appointment_date;
          if (data.choose_appointment_date) {
            $('.choose_appointment_date').show();
            $('.no_choose_appointment_date').hide();
            /* PUSH IN DATE PICKER ... if there is a date picker */
            if ($('.datepicker_date').length) {
              $('.datepicker_date').each(function (_idx, element) {
                $(element).val('')
                  .show()
                  .pickadate()
                  .pickadate('picker')
                  .set('min', [
                    firstDay.getFullYear(),
                    firstDay.getMonth(),
                    firstDay.getUTCDate()
                  ])
                  .set('max', [
                    datePickDate.getFullYear(),
                    datePickDate.getMonth(),
                    datePickDate.getUTCDate()
                  ]);
              })
            }
          } else {
            $('.choose_appointment_date').hide();
            $('.no_choose_appointment_date').show();
          }

          /* CONSTRUCT ARRAY FOR UNVAIVALABLE DAY */
          for (i in data.unavailable_day_list) {
            if (data.unavailable_day_list.hasOwnProperty(i)) {
              fullDaysArray.push(data.unavailable_day_list[i]);
            }
          }
        });
    }

},
  showPickadateFull: function(fullDaysArray) {
    for (var i = 0; i < fullDaysArray.length; i++) {
      var d = new Date(fullDaysArray[i]);
      // make this date timezone naive
      var utc_date = new Date(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        d.getUTCHours(),
        d.getUTCMinutes()
      );
      $('[data-pick="' + utc_date.getTime() + '"]').addClass('pickadate--full');
    }
    /* DISABLE FULL DATE */
    $('.pickadate--full').on('click', function(e) {
      return false;
    });
  },

  changeIcon: function() {
    $('.icons').each(function() {
      $(this).attr(
        'src',
        $(this)
          .attr('src')
          .replace('0a57a5', '006b34')
      );
    });
  },

  changeFormula: function() {
    /* until user click on premium checkbox, we are standard. */
    $('.premium-application-only').hide();
    $('.standard-application-only').show();

    $(document).on(
      'change',
      '.bloc.premium .field-bloc-premium .field-wrapper-premium input[type="checkbox"]', // this is #premium_secondly
      function() {
        /* CHANGE OPTION PREMIUM */
        if ($(this).is(':checked')) {
          onPremiumFormulaSelected();
          $(
            'fieldset[data-step="1"] .container .step-container-data .bloc.choose.last .formula.last input[type="radio"]'
          ).prop('checked', true);
          booking.prepareCalendar();

          if (lang === 'fr') {
            $(
              'fieldset[data-step="1"] .container .step-container-summary .name_zone'
            ).html('zone platinum');
            $(
              '.booking fieldset[data-step="3"] .step-container-summary > div > p'
            )
              .find('span')
              .html('de profiter de notre <strong>"Salon Platinum"</strong>');
          } else {
            $(
              'fieldset[data-step="1"] .container .step-container-summary .name_zone'
            ).html('platinum service');
            $(
              '.booking fieldset[data-step="3"] .step-container-summary > div > p'
            )
              .find('span')
              .html('<strong>"Platinum service"</strong>');
          }
        } else {
          onStandardFormulaSelected();
          $(
            'fieldset[data-step="1"] .container .step-container-data .bloc.choose .formula input[type="radio"]'
          ).prop('checked', true);
          booking.prepareCalendar();

          // XXX this would need to be defined in HTML ...
          if (lang === 'fr') {
            $(
              'fieldset[data-step="1"] .container .step-container-summary .name_zone'
            ).html('zone standard');
            $(
              '.booking fieldset[data-step="3"] .step-container-summary > div > p'
            )
              .find('span')
              .html("d'être reçu <strong>dans la zone Classique</strong>");
          } else {
            $(
              'fieldset[data-step="1"] .container .step-container-summary .name_zone'
            ).html('standard section');
            $(
              '.booking fieldset[data-step="3"] .step-container-summary > div > p'
            )
              .find('span')
              .html('<strong>Standard section</strong>');
          }
        }
      }
    );
  },

  changeArea: function(myIndex) {
    /* PUSH DATA FOR IN BIO & FORMULA */
    /* BIO */
    $('.popup div[data-popup="bio_visa"] div div.content')
      .empty()
      .append(
        myDataWebServiceGlobal.capago_center_list[myIndex]
          .capago_center_bio_exemption_html
      );

    /* FORMULA STANDARD */
    /* IMG */
    $(
      'fieldset[data-step="1"] .step-container-data .bloc.choose:not(.last) .illustration img'
    ).attr(
      'src',
      myDataWebServiceGlobal.capago_center_list[myIndex]
        .capago_center_std_image_url
    );

    /* PARAGRAPH */
    $(
      'fieldset[data-step="1"] .step-container-data .bloc.choose:not(.last) .content'
    )
      .empty()
      .append(
        myDataWebServiceGlobal.capago_center_list[myIndex]
          .capago_center_std_formula_html
      );
    $(
      'fieldset[data-step="3"] .step-container-data .bloc.premium div div .content'
    )
      .empty()
      .append(
        myDataWebServiceGlobal.capago_center_list[myIndex]
          .capago_center_vip_formula_html
      );

    /* FORMULA PREMIUM */
    /* IMG */
    $(
      'fieldset[data-step="1"] .step-container-data .bloc.choose.last .illustration img'
    ).attr(
      'src',
      myDataWebServiceGlobal.capago_center_list[myIndex]
        .capago_center_vip_image_url
    );

    /* PARAGRAPH */
    $('fieldset[data-step="1"] .step-container-data .bloc.choose.last .content')
      .empty()
      .append(
        myDataWebServiceGlobal.capago_center_list[myIndex]
          .capago_center_vip_formula_html
      );
  },

  changeService: function(myId, onLoad) {
    /* GET DATA FOR WEB SERVICE LIST */
    $.ajax({
      url: webServiceListUrl,
      type: 'get',
      data: 'capago_center_id=' + myId,
      dataType: 'json',
      success: function(data) {
        $.each(data.service_list, function(index, value) {
          $('[data-html="' + value.service_reference + '"]').html(
            value.service_price
          );
        });

        /* PUSH DATA FOR PRICE SMS FOLLOW UP */
        for (i = 0; i < data.service_list.length; i++) {
          if (data.service_list[i].service_reference
              && data.service_list[i].service_reference.includes('SMS')) {
            servicePriceSmsFollowUp = data.service_list[i].service_price;
          }
        }

        /* STOCK DATA */
        if (servicePriceSmsFollowUp) {
          $('[data-html="sms-follow-up"]').html(servicePriceSmsFollowUp);
        }

        /* SHOW PAGE ON LOAD WHEN AJAX IS SUCCESS */
        if (onLoad === true) {
          /* TRIGGER FOR DISPLAY BORDER ON BOOKING PAGE */
          $(window).resize();

          /* FADE OUT ON LOADER */
          setTimeout(function() {
            NProgress.done();
            $('body').removeClass('loading');
            $('.module.loader').fadeTo('slow', 0, function() {
              $(this).remove();
            });
          }, 1000);
        }
      }
    });

    /* PUSH DYNAMIC DATA IN SELECT ON STEP 2 (VISA TYPE...) FOR EACH APPLICANT */
    $.ajax({
      url: webServiceVisaUrl,
      type: 'get',
      data: 'capago_center_id=' + myId,
      dataType: 'json',
      success: function(data) {
        /* STOCK OBJECT IN VARIABLE */
        myVisaTypeListObject = data;

        var dataVisa = data.visa_type_list;
        var htmlVisaStayDuration = '<option value="" selected>- -</option>';
        var seen = new Set();

        for (var i = 0; i < dataVisa.length; i++) {
          var id = dataVisa[i].visa_stay_duration_id;
          if (!seen.has(id)) {
            seen.add(id);
            htmlVisaStayDuration +=
              '<option value="' +
              id +
              '">' +
              dataVisa[i].visa_stay_duration +
              '</option>';
          }
        }
        $(  
          'fieldset.step-container[data-step="2"] .step-container-data .traveller-details .traveller-details-form .field-wrapper[data-input="visa_stay_duration"] select[name="visa_stay_duration_traveller_1"]'
        )
          .html(htmlVisaStayDuration)
          .selectric('refresh');
      }
    });
  },

  clickArea: function() {
    $(document).on(
      'change',
      'fieldset[data-step="1"] .step-container-data .bloc.last .area input[name="area"]',
      function() {
        /* VARIABLES */
        var myIndex =
          $(this)
            .closest('div')
            .index() - 1;
        var myId = $(this).val();

        /* CHANGE DATA FOR AREA */
        booking.changeArea(myIndex);

        /* CHANGE DATA FOR SERVICE LIST */
        booking.changeService(myId, false);
      }
    );
  },

  deliveryDetailsFormInvoice: function() {
    /* HIDE/SHOW ELEMENTS */
    $('.bloc.invoice > div > .field-wrapper')
      .find(':checkbox')
      .bind('change', function() {
        if ($(this).is(':checked')) {
          $('.bloc.invoice > div > .delivery-details-form').removeClass('hide');
        } else {
          $('.bloc.invoice > div > .delivery-details-form').addClass('hide');
        }

        booking.border();
      });
  },

  followBySms: function() {
    /* HIDE/SHOW ELEMENTS */
    $('.bloc.sms > div > div > .field-wrapper')
      .find(':checkbox')
      .bind('change', function() {
        if ($(this).is(':checked')) {
          $(
            '.bloc.sms > div > div > .field-wrapper + .field-wrapper'
          ).removeClass('hide');
          $('.bloc.sms > div > div > .others').removeClass('hide');
        } else {
          $('.bloc.sms > div > div > .field-wrapper + .field-wrapper').addClass(
            'hide'
          );
          $('.bloc.sms > div > div > .others').addClass('hide');
        }

        booking.border();
      });
  },

  deliveryVisa: function() {
    /* HIDE/SHOW ELEMENTS */
    $('.bloc.passport > div > .field-wrapper')
      .find(':radio')
      .bind('change', function() {
        if (
          $(this)
            .filter(':checked')
            .val() === 'home_delivery'
        ) {
          $('.bloc.delivery').removeClass('hide');
        } else {
          $('.bloc.delivery').addClass('hide');
        }

        booking.border();
      });
  },

  photosPortrait: function() {
    /* HIDE/SHOW ELEMENTS */
    $(
      '.bloc.documents .document .content-bloc-documents .field-bloc-documents .field-wrapper-documents > input[name="portrait"]'
    ).bind('change', function() {
      if (
        $(this)
          .filter(':checked')
          .val() === 'yes_portrait'
      ) {
        $(
          '.bloc.documents .document .content-bloc-documents .field-bloc-documents .field-wrapper-documents div'
        ).removeClass('hide');
      } else {
        $(
          '.bloc.documents .document .content-bloc-documents .field-bloc-documents .field-wrapper-documents div'
        ).addClass('hide');
      }
    });
  },

  changeIconPassport: function() {
    /*CHANGE BACKGROUND OF CHECKED INPUT */
    $('.bloc.passport > div > .field-wrapper')
      .find(':radio')
      .bind('change', function() {
        if ($(this).is(':checked')) {
          $('.bloc.passport > div > .icon').removeClass('active');
          $(this)
            .closest('.field-wrapper')
            .prev('.icon')
            .addClass('active');
        }
      });
  },

  addTravellersData: function(nb, area) {
    var renewal_template, renewal,
      visa_file_variation_template, visa_file_variation;
    /* ONLY IF CURRENT NUMBER IF DIFFERENT */
    if (nb != myCurrentNumberTravellers) {
      /* REMOVE OLD TRAVELLERS */
      $(
        '.booking-form fieldset[data-step="2"] .step-container-data .content .traveller-details'
      )
        .slice(1)
        .remove();

      renewal_template = $('div[data-input="renewal"]');  
      visa_file_variation_template = $('div[data-input="visa-file-variation"]');

      /* RESET ERRORS MESSAGE */
      $(
        '.booking-form fieldset[data-step="2"] .step-container-data .content .error-message'
      ).html('');

      /* RESET ERROR CLASS */
      $(
        '.booking-form fieldset[data-step="2"] .step-container-data .content .traveller-details-form .field-wrapper'
      ).each(function() {
        $(this)
          .find('.error')
          .removeClass('error');
      });

      /* RESET SELECT FOR APPLICANT 1 */
      $(
        'fieldset.step-container[data-step="2"] .step-container-data .traveller-details .traveller-details-form .field-wrapper[data-input="visa_stay_duration"]')
      .find('.selectric-wrapper select[name="visa_stay_duration_traveller_1"]')
      .empty();
      $(
        'fieldset.step-container[data-step="2"] .step-container-data .traveller-details .traveller-details-form .field-wrapper[data-input="travel_purpose"]')
      .hide()
      .find('.selectric-wrapper select[name="travel_purpose_traveller_1"]')
      .empty();
      $(
        'fieldset.step-container[data-step="2"] .step-container-data .traveller-details .traveller-details-form .field-wrapper[data-input="type"]')
      .hide()
      .find('.selectric-wrapper select[name="type_visa_traveller_1"]')
      .empty();
      $(
        'fieldset.step-container[data-step="2"] .step-container-data .traveller-details .traveller-details-form .field-wrapper[data-input="precision1"]'
      )
        .hide()
        .find('.selectric-wrapper select[name="precision1"]')
        .empty();
      $(
        'fieldset.step-container[data-step="2"] .step-container-data .traveller-details .traveller-details-form .field-wrapper[data-input="precision2"]'
      )
        .hide()
        .find('.selectric-wrapper select[name="precision2"]')
        .empty();

      /* ADD OPTIONS FOR VISA TYPE SELECT FOR MAIN APPLICANT */
      html += '<option value="" selected>- -</option>';

      /* FUNCTION TO ADD DYNAMIC SELECT */
      var dataVisa = myVisaTypeListObject.visa_type_list;
      var htmlVisaStayDuration = '';
      var seen = new Set();

      for (var i = 0; i < dataVisa.length; i++) {
        var id = dataVisa[i].visa_stay_duration_id;
        if (!seen.has(id)) {
          seen.add(id);
          htmlVisaStayDuration +=
            '<option value="' +
            id +
            '">' +
            dataVisa[i].visa_stay_duration +
            '</option>';
        }
      }


      html += htmlVisaStayDuration;
      $(
        'fieldset[data-step="2"] .step-container-data .traveller-details .traveller-details-form .field-wrapper[data-input="visa_stay_duration"] select[name="visa_stay_duration_traveller_1"]'
      )
        .append(html)
        .selectric('refresh');

      /* CHECK ALL INPUT FOR EACH TRAVELLER */
      for (var i = 2; i <= nb; i++) {
        var html = '';
        html += '<div class="traveller-details">';
        html += '<div class="traveller-details-header">';
        html += '<div>';
        html +=
          '<img class="icons icon-Circled-User-Male" src="../img/icons/circled-user-male-' +
          colorHexa +
          '.svg">';
        html += '</div>';

        html += translationMessages.travellerIndexForSMSBloc.replace(
          '${traveller_index}',
          '' + i
        );
        html += '<div class="separator"><div></div></div>';

        /* ONLY IF HTML BLOC FOR TRACK MY VISA APPLICATION VIA SMS EXIST */
        if ($('.bloc.sms').length) {
          html += '<div class="field-wrapper" data-input="sms">';
          html +=
            '<img class="icons icon-Sms" src="../img/icons/sms-' +
            colorHexa +
            '.svg">';
          html +=
            '<input type="checkbox" name="sms_folder_traveller_' +
            i +
            '" id="sms_folder_traveller_' +
            i +
            '">';
          html += '<label for="sms_folder_traveller_' + i + '">';
          if (servicePriceSmsFollowUp) {
            html += translationMessages.enableSMSFollowup
              .replace('${price_sms_service}', servicePriceSmsFollowUp)
              .replace('${currency_code}', currencyCode);
          }
          html += '</label>';
          html += '</div>';
        }

        html += '</div>';
        html += '<div class="traveller-details-form">';
        html += '<div class="field-wrapper" data-input="title">';

        html +=
          '<label for="title_traveller_' +
          i +
          '">' +
          translationMessages.title +
          '</label>';

        html +=
          '<select name="title_traveller_' +
          i +
          '" id="title_traveller_' +
          i +
          '">';

        /* FUNCTION TO ADD DYNAMIC TITLE */
        var dataList = myObjectTitleList.social_title_list;
        var htmlList = '<option value="" selected>- -</option>';

        for (var j = 0; j < dataList.length; j++) {
          htmlList +=
            '<option value="' +
            dataList[j].id +
            '">' +
            dataList[j].title +
            '</option>';
        }

        html += htmlList;

        html += '</select>';
        html += '</div>';
        html += '<div class="field-wrapper" data-input="lastname">';
        html +=
          '<label for="lastname_traveller_' +
          i +
          '">' +
          translationMessages.lastName +
          '</label>';

        html +=
          '<input type="text" name="lastname_traveller_' +
          i +
          '" id="lastname_traveller_' +
          i +
          '">';
        html += '</div>';
        html += '<div class="field-wrapper" data-input="firstname">';
        html +=
          '<label for="firstname_traveller_' +
          i +
          '">' +
          translationMessages.firstName +
          '</label>';

        html +=
          '<input type="text" name="firstname_traveller_' +
          i +
          '" id="firstname_traveller_' +
          i +
          '">';
        html += '</div>';
        html += '<div class="field-wrapper" data-input="birth">';
        html +=
          '<label for="birth_traveller_' +
          i +
          '">' +
          translationMessages.birthDay +
          '</label>';
        html +=
          '<select name="day_birth_traveller_' +
          i +
          '" id="birth_traveller_' +
          i +
          '" class="day">';
        html += '<option value="" selected>- -</option>';

        for (var j = 0; j <= arrayDay.length - 1; j++) {
          html +=
            '<option value="' + arrayDay[j] + '">' + arrayDay[j] + '</option>';
        }

        html += '</select>';
        html += '<select name="month_birth_traveller_' + i + '" class="month">';
        html += '<option value="" selected>- -</option>';

        for (var k = 0; k <= arrayMonth.length - 1; k++) {
          html +=
            '<option value="' +
            arrayMonth[k] +
            '">' +
            arrayMonth[k] +
            '</option>';
        }

        html += '</select>';
        html +=
          '<select name="year_birth_traveller_' + i + '" class="year last">';
        html += '<option value="" selected>- -</option>';

        for (var l = 0; l <= arrayYear.length - 1; l++) {
          html +=
            '<option value="' +
            arrayYear[l] +
            '">' +
            arrayYear[l] +
            '</option>';
        }

        html += '</select>';
        html += '</div>';
        html += '<div class="field-wrapper" data-input="passport">';
        html +=
          '<label for="number_passport_traveller_' +
          i +
          '">' +
          translationMessages.passportNumber +
          '</label>';

        html +=
          '<input type="text" name="number_passport_traveller_' +
          i +
          '" placeholder="" id="number_passport_traveller_' +
          i +
          '">';
        html += '</div>';

        html += '<div class="field-wrapper" data-input="departure_date">';
        html +=
          '<label for="departure_date_traveller_' +
          i +
          '">' +
          translationMessages.departureDate +
          '</label>';
        html +=
          '<select name="day_departure_date_traveller_' +
          i +
          '" id="departure_date_traveller_' +
          i +
          '" class="day">';
        html += '<option value="" selected>- -</option>';

        for (var j = 0; j <= arrayDay.length - 1; j++) {
          html +=
            '<option value="' + arrayDay[j] + '">' + arrayDay[j] + '</option>';
        }

        html += '</select>';
        html += '<select name="month_departure_date_traveller_' + i + '" class="month">';
        html += '<option value="" selected>- -</option>';

        for (var k = 0; k <= arrayMonth.length - 1; k++) {
          html +=
            '<option value="' +
            arrayMonth[k] +
            '">' +
            arrayMonth[k] +
            '</option>';
        }

        html += '</select>';
        html +=
          '<select name="year_departure_date_traveller_' + i + '" class="year last">';
        html += '<option value="" selected>- -</option>';

        for (var l = 0; l <= arrayYearArrival.length - 1; l++) {
          html +=
            '<option value="' +
            arrayYearArrival[l] +
            '">' +
            arrayYearArrival[l] +
            '</option>';
        }

        html += '</select>';
        html += '</div>';

        // Replicate Duration of Stay
        html += '<div class="field-wrapper" data-input="visa_stay_duration">';
        html +=
          '<label for="visa_stay_duration_traveller_' +
          i +
          '">' +
          translationMessages.durationOfStay;
        html += '</label>';

        html +=
          '<select name="visa_stay_duration_traveller_' +
          i +
          '" id="visa_stay_duration_traveller_' +
          i +
          '">';
        html += '<option value="" selected>- -</option>';

        /* FUNCTION TO ADD DYNAMIC SELECT */
        var dataVisa = myVisaTypeListObject.visa_type_list;
        var htmlVisa = '';
        var seen = new Set();

        for (var k = 0; k < dataVisa.length; k++) {
          var id = dataVisa[k].visa_stay_duration_id;
          if (!seen.has(id)) {
            seen.add(id);
            htmlVisa +=
              '<option value="' +
              id +
              '">' +
              dataVisa[k].visa_stay_duration +
              '</option>';
          }
        }

        html += htmlVisa;
        html += '</select>';
        html += '</div>';

        // XXX is this needed ?
        html += '<div class="field-wrapper" data-input="travel_purpose">';
        html +=
          '<label for="travel_purpose_traveller_' +
          i +
          '">' +
          translationMessages.purposeOfTravel;
        html += '</label>';
        html += '</div>';

        // XXX is this needed ?
        if (lang === 'fr') {
          html += '<div class="field-wrapper" data-input="type">';
        } else {
          html += '<div class="field-wrapper en" data-input="type">';
        }
        html +=
          '<label for="type_visa_traveller_' +
          i +
          '">' +
          translationMessages.visaType;
        html += '<a href="#" class="popup" data-popup="type_visa">';
        html +=
          '<img class="icons icon-About" src="../img/icons/about-' +
          colorHexa +
          '.svg">';
        html += '</a>';
        html += '</label>';
        html += '</div>';

        html += '<div class="field-wrapper" data-input="precision1">';
        html +=
          '<label for="precision1_traveller_' +
          i +
          '">' +
          translationMessages.variation +
          '</label>';
        html += '</div>';

        html += '<div class="field-wrapper" data-input="precision2">';
        html +=
          '<label for="precision2_traveller_' +
          i +
          '">' +
          translationMessages.checkList +
          '</label>';
        html += '</div>';

        if (renewal_template.length) {
          renewal = renewal_template.clone();
          renewal.find("input#renewal_traveller_1").attr("id", "renewal_traveller_" + i)
          renewal.find("input").attr("name", "renewal_traveller_" + i);
          renewal.find("label").attr("for", "renewal_traveller_" + i);
          html += renewal.html();
        }

        if (visa_file_variation_template.length) {
          var visa_file_variation = visa_file_variation_template.clone();
          var select = visa_file_variation.find('select').clone();
          visa_file_variation.find('.selectric-wrapper').remove();
          select.attr('id', 'visa_file_variation_traveller_' + i)
            .attr('name', 'visa_file_variation_traveller_' + i);
          visa_file_variation.find(".variation-description").first().before(select);
          visa_file_variation.find("input").attr("name", "visa_file_variation_traveller_" + i);
          visa_file_variation.find("label").attr("for", "visa_file_variation_traveller_" + i);
          html += '<div class="field-wrapper" data-input="visa-file-variation">' + 
            visa_file_variation.html() +
            '</div>';
        }

        html += '</div>';
        html += '</div>';

        /* INSERT NEW TRAVELLERS TO THE END OF THE BLOC */
        $(
          '.booking-form fieldset[data-step="2"] .step-container-data .content .next-step'
        ).before(html);
        $(
          'fieldset[data-step="2"] .step-container-data .traveller-details .traveller-details-form .field-wrapper[data-input="visa-file-variation"] select#visa_file_variation_traveller_' + i
        ).selectric();
        /* LOAD POPUP */
        booking.hoverPopup();
        booking.openPopup();
        booking.closePopup();
      }
    } else {
      /* RESET/HIDE SELECT (VISA TYPE...) FOR EACH APPLICANT ONLY IF AREA HAS CHANGED */
      if (area != myCurrentArea) {
        $(
          'fieldset.step-container[data-step="2"] .step-container-data .traveller-details'
        ).each(function() {
          var myApplicant = $(this);

          myApplicant
            .find(
              '.traveller-details-form .field-wrapper[data-input="type"] .selectric-wrapper select'
            )
            .empty();
          myApplicant
            .find(
              '.traveller-details-form .field-wrapper[data-input="precision1"]'
            )
            .hide()
            .find('.selectric-wrapper select')
            .empty();
          myApplicant
            .find(
              '.traveller-details-form .field-wrapper[data-input="precision2"]'
            )
            .hide()
            .find('.selectric-wrapper select')
            .empty();
        });

        /* RESET SELECT VISA TYPE FOR EACH APPLICANT */
        for (var i = 1; i <= nb; i++) {
          var html = '';

          html += '<option value="" selected>- -</option>';

          /* FUNCTION TO ADD DYNAMIC SELECT */
          var dataVisa = myVisaTypeListObject.visa_type_list;
          var htmlVisa = '';

          for (var k = 0; k < dataVisa.length; k++) {
            htmlVisa +=
              '<option value="' +
              dataVisa[k].visa_type_id +
              '">' +
              dataVisa[k].visa_type +
              '</option>';
          }

          html += htmlVisa;

          $(
            'fieldset[data-step="2"] .step-container-data .traveller-details .traveller-details-form .field-wrapper[data-input="type"] select[name="type_visa_traveller_' +
              i +
              '"]'
          )
            .append(html)
            .selectric('refresh');
        }
      }
    }
  },

  addTravellersOptions: function() {
    /* Duration of Visa */
    $(document).on(
      'change',
      '.traveller-details .traveller-details-form .field-wrapper[data-input="visa_stay_duration"] select',
      function() {
        /* VARIABLES */
        var myIndex = $(this)
          .closest('.traveller-details')
          .index();
        var myElement = $(this).closest('.field-wrapper');
        valType = $(this).val();

        /* HIDE OTHERS SELECT */
        myElement
          .parent('.traveller-details-form')
          .find('.field-wrapper[data-input="type"]')
          .hide();
        myElement
          .parent('.traveller-details-form')
          .find('.field-wrapper[data-input="precision1"]')
          .hide();
        myElement
          .parent('.traveller-details-form')
          .find('.field-wrapper[data-input="precision2"]')
          .hide();

        if (valType !== '') {
          for (var i = 0; i < myVisaTypeListObject.visa_type_list.length; i++) {
            if (
              myVisaTypeListObject.visa_type_list[i].visa_stay_duration_id === valType
            ) {
              var myObject = myVisaTypeListObject.visa_type_list[i];
              var myOptions =
                '<select name="travel_purpose_traveller_' +
                myIndex +
                '" id="travel_purpose_traveller_' +
                myIndex +
                '"><option value="" selected>--</option>';

              for (var j = 0; j < myVisaTypeListObject.product_line_list.length; j++) {
                if (myVisaTypeListObject.product_line_list[j].product_line_id === valType) {
                  var product_line_list = myVisaTypeListObject.product_line_list[j].product_line_list;
                  for (var k = 0; k < product_line_list.length; k++) {
                    myOptions +=
                      '<option value="' +
                      product_line_list[k].product_line_id +
                      '">' +
                      product_line_list[k].product_line +
                      '</option>';                   
                  }
                }

              }

              myOptions += '</select>';

              /* IF SELECT ALREADY EXIST, REMOVE IT */
              if (
                myElement
                  .parent('.traveller-details-form')
                  .find('.field-wrapper[data-input="travel_purpose"] div')
              ) {
                myElement
                  .parent('.traveller-details-form')
                  .find('.field-wrapper[data-input="travel_purpose"] div')
                  .remove();
              }

              /* APPEND HTML */
              myElement
                .parent('.traveller-details-form')
                .find('.field-wrapper[data-input="travel_purpose"]')
                .append(myOptions);
              myElement
                .parent('.traveller-details-form')
                .find('.field-wrapper[data-input="travel_purpose"] select')
                .selectric({ disableOnMobile: false });

              /* SHOW SELECT */
              myElement
                .parent('.traveller-details-form')
                .find('.field-wrapper[data-input="travel_purpose"]')
                .show();
            }
          }
        }
      }
    );

    /* Purpose of travel */
    $(document).on(
      'change',
      '.traveller-details .traveller-details-form .field-wrapper[data-input="travel_purpose"] select',
      function() {
        /* VARIABLES */
        var myIndex = $(this)
          .closest('.traveller-details')
          .index();
        var myElement = $(this).closest('.field-wrapper');
        valType = $(this).val();
        var varVisaStayDuration = $(this).closest(".traveller-details").find('[data-input="visa_stay_duration"] select').val();

        /* HIDE OTHERS SELECT */
        myElement
          .parent('.traveller-details-form')
          .find('.field-wrapper[data-input="precision1"]')
          .hide();
        myElement
          .parent('.traveller-details-form')
          .find('.field-wrapper[data-input="precision2"]')
          .hide();
        if (valType !== '') {
          var myOptions =
            '<select name="type_visa_traveller_' +
            myIndex +
            '" id="type_visa_traveller_' +
            myIndex +
            '"><option value="" selected>--</option>';
          for (var i = 0; i < myVisaTypeListObject.visa_type_list.length; i++) {
            if (
              myVisaTypeListObject.visa_type_list[i].visa_type_id === valType
              && myVisaTypeListObject.visa_type_list[i].visa_stay_duration_id === varVisaStayDuration
            ) {
              var myObject = myVisaTypeListObject.visa_type_list[i];
              myOptions +=
                '<option value="' +
                myObject.resource_id +
                '">' +
                myObject.visa_type +
                '</option>';
            }
          }

          myOptions += '</select>';

          /* IF SELECT ALREADY EXIST, REMOVE IT */
          if (
            myElement
              .parent('.traveller-details-form')
              .find('.field-wrapper[data-input="type"] div')
            ) {
            myElement
              .parent('.traveller-details-form')
              .find('.field-wrapper[data-input="type"] div')
              .remove();
            }

          /* APPEND HTML */
          myElement
            .parent('.traveller-details-form')
            .find('.field-wrapper[data-input="type"]')
            .append(myOptions);
          myElement
            .parent('.traveller-details-form')
            .find('.field-wrapper[data-input="type"] select')
            .selectric({ disableOnMobile: false });

          /* SHOW SELECT */
          myElement
            .parent('.traveller-details-form')
            .find('.field-wrapper[data-input="type"]')
            .show();
        }
      }
    );


    /* TYPE OF VISA */
    $(document).on(
      'change',
      '.traveller-details .traveller-details-form .field-wrapper[data-input="type"] select',
      function() {
        /* VARIABLES */
        var myIndex = $(this)
          .closest('.traveller-details')
          .index();
        var myElement = $(this).closest('.field-wrapper');
        valType = $(this).val();

        /* HIDE OTHERS SELECT */
        myElement
          .parent('.traveller-details-form')
          .find('.field-wrapper[data-input="precision1"]')
          .hide();
        myElement
          .parent('.traveller-details-form')
          .find('.field-wrapper[data-input="precision2"]')
          .hide();
        if (valType !== '') {
          for (var i = 0; i < myVisaTypeListObject.visa_type_list.length; i++) {
            if (
              myVisaTypeListObject.visa_type_list[i].resource_id === valType
            ) {
              var myObject = myVisaTypeListObject.visa_type_list[i];
              var myOptions =
                '<select name="precision1_traveller_' +
                myIndex +
                '" id="precision1_traveller_' +
                myIndex +
                '"><option value="" selected>--</option>';

              for (var j = 0; j < myObject.visa_variation_list.length; j++) {
                myOptions +=
                  '<option value="' +
                  myObject.visa_variation_list[j].visa_variation_id +
                  '">' +
                  myObject.visa_variation_list[j].visa_variation_name +
                  '</option>';
              }

              myOptions += '</select>';

              /* IF SELECT ALREADY EXIST, REMOVE IT */
              if (
                myElement
                  .parent('.traveller-details-form')
                  .find('.field-wrapper[data-input="precision1"] div')
              ) {
                myElement
                  .parent('.traveller-details-form')
                  .find('.field-wrapper[data-input="precision1"] div')
                  .remove();
              }

              /* APPEND HTML */
              myElement
                .parent('.traveller-details-form')
                .find('.field-wrapper[data-input="precision1"]')
                .append(myOptions);
              myElement
                .parent('.traveller-details-form')
                .find('.field-wrapper[data-input="precision1"] select')
                .selectric({ disableOnMobile: false });

              /* SHOW SELECT */
              myElement
                .parent('.traveller-details-form')
                .find('.field-wrapper[data-input="precision1"]')
                .show();
            }
          }
        }
      }
    );

    /* PRECISION 1 */
    $(document).on(
      'change',
      '.traveller-details .traveller-details-form .field-wrapper[data-input="precision1"] select',
      function() {
        /* VARIABLES */
        var myIndex = $(this)
          .closest('.traveller-details')
          .index();
        var myElement = $(this).closest('.field-wrapper');
        valPrecision = $(this).val();

        /* HIDE OTHER SELECT */
        myElement
          .parent('.traveller-details-form')
          .find('.field-wrapper[data-input="precision2"]')
          .hide();

        if (valPrecision !== '') {
          for (var i = 0; i < myVisaTypeListObject.visa_type_list.length; i++) {
            if (
              myVisaTypeListObject.visa_type_list[i].resource_id === valType
            ) {
              var myObjectVisaType = myVisaTypeListObject.visa_type_list[i];

              for (
                var j = 0;
                j < myObjectVisaType.visa_variation_list.length;
                j++
              ) {
                if (
                  myObjectVisaType.visa_variation_list[j].visa_variation_id ===
                  valPrecision
                ) {
                  myObjectVisaVariation =
                    myObjectVisaType.visa_variation_list[j];
                  var myOptions =
                    '<select name="precision2_traveller_' +
                    myIndex +
                    '" id="precision2_traveller_' +
                    myIndex +
                    '"><option value="" selected>--</option>';

                  for (
                    var k = 0;
                    k < myObjectVisaVariation.validation_checklist_list.length;
                    k++
                  ) {
                    myOptions +=
                      '<option value="' +
                      myObjectVisaVariation.validation_checklist_list[k]
                        .validation_checklist_id +
                      '">' +
                      myObjectVisaVariation.validation_checklist_list[k]
                        .validation_checklist_name +
                      '</option>';
                  }

                  myOptions += '</select>';

                  /* IF SELECT ALREADY EXIST, REMOVE IT */
                  if (
                    myElement
                      .parent('.traveller-details-form')
                      .find('.field-wrapper[data-input="precision2"] div')
                  ) {
                    myElement
                      .parent('.traveller-details-form')
                      .find('.field-wrapper[data-input="precision2"] div')
                      .remove();
                  }

                  /* APPEND HTML */
                  myElement
                    .parent('.traveller-details-form')
                    .find('.field-wrapper[data-input="precision2"]')
                    .append(myOptions);
                  myElement
                    .parent('.traveller-details-form')
                    .find('.field-wrapper[data-input="precision2"] select')
                    .selectric({ disableOnMobile: false });

                  /* SHOW SELECT */
                  myElement
                    .parent('.traveller-details-form')
                    .find('.field-wrapper[data-input="precision2"]')
                    .show();
                }
              }
            }
          }
        }
      }
    );

    /* Visa File Variation */
    $(document).on(
      'change',
      '.traveller-details .traveller-details-form .field-wrapper[data-input="visa-file-variation"] select',
      function() {
        var myElement = $(this).closest('.field-wrapper');
        var valVariation = $(this).val();
        myElement.find(".variation-description").hide();
        if (valVariation) {
          myElement.find("div#" + valVariation).css("display", "inline-block");
        }
      }
    );
  },

  addTravellersSms: function(myData) {
    var i = 1;
    var htmlSms = '';
    var myDenom;

    for (var x in myData) {
      if (myData[x][0] === 'Mrs') {
        myDenom = 'M<span class="abbreviation">rs</span>';
      } else if (myData[x][0] === 'Mme') {
        myDenom = 'M<span class="abbreviation">me</span>';
      } else if (myData[x][0] === 'Mlle') {
        myDenom = 'M<span class="abbreviation">lle</span>';
      } else {
        myDenom = myData[x][0];
      }

      htmlSms += '<div class="field-wrapper">';
      htmlSms +=
        '<input type="checkbox" name="follow_sms_traveller_' +
        i +
        '" id="follow_sms_traveller_' +
        i +
        '">';

      htmlSms += '<label for="follow_sms_traveller_' + i + '">';

      htmlSms += (i === 1
        ? translationMessages.travellerNameMainContactForSMS
        : translationMessages.travellerNameForSMS
      )
        .replace('${traveller_index}', '' + i)
        .replace('${social_title}', myDenom)
        .replace('${traveller_name}', myData[x][1]);

      htmlSms += '</label>';
      htmlSms += '</div>';
      i++;
    }

    $('.bloc.sms .others div').html(htmlSms);
  },

  hoverPopup: function() {
    $('a.popup').hover(
      function() {
        var myElem = $(this);

        /* ON MOUSE IN, START TIMEOUT */
        timer = setTimeout(function() {
          booking.showPopup(myElem);
        }, delay);
      },
      function() {
        /* ON MOUSE OUT, CANCEL TIMER */
        clearTimeout(timer);
      }
    );
  },

  openPopup: function() {
    $('a.popup').click(function(e) {
      e.preventDefault();

      booking.showPopup($(this));
    });
  },

  closePopup: function() {
    $('div.popup > div .close').click(function(e) {
      e.preventDefault();

      /* HIDE MODAL */
      $(this)
        .closest('div[data-popup]')
        .hide();
      $(this)
        .closest('.popup')
        .removeClass('open');
    });
  },

  showPopup: function(link) {
    /* VARIABLES */
    var myPopupIcon = link;
    var myPopupContainer = $(
      'div.popup > div[data-popup="' + myPopupIcon.data('popup') + '"]'
    );

    myPopupContainer.show();
    myPopupContainer.closest('div.popup').addClass('open');
  },

  /* OTHERS FUNCTIONS FOR DESIGN*/
  border: function() {
    $('.booking fieldset').each(function() {
      var fieldset = $(this);

      /* CUSTOM HEIGHT */
      if (fieldset.find('.step-container-data').is(':visible')) {
        fieldset
          .find('.step-container-border')
          .height(fieldset.find('.step-container-data').outerHeight());
      } else {
        fieldset
          .find('.step-container-border')
          .height(fieldset.find('.step-container-summary').outerHeight());
      }
    });
  },

  separator: function(animate) {
    /* SET FOR ALL TRAVELLERS DETAILS */
    $('.traveller-details').each(function() {
      var travellerHeader = $(this).find('.traveller-details-header');
      var travellerHeaderW = travellerHeader.width();

      var travellerIcoW = travellerHeader
        .find('div')
        .first()
        .width();
      var travellerNameW = travellerHeader.find('.traveller').width();
      var fieldW = travellerHeader.find('.field-wrapper').width();

      var separatorW =
        travellerHeaderW - (travellerIcoW + travellerNameW + fieldW);

      /* ANIMATE WIDTH */
      if (animate === 0) {
        $(this)
          .find('.separator > div')
          .width(separatorW - 25);
      } else {
        $(this)
          .find('.separator > div')
          .animate(
            {
              width: separatorW - 25
            },
            {
              duration: 900,
              easing: 'easeOutCubic'
            }
          );
      }
    });
  },

  documents: function() {
    var firstBlocP = $(
      '.bloc.documents .document .content-bloc-documents > .paragraph p'
    ).outerHeight();
    var secondBlocP = $(
      '.bloc.documents .document.last .content-bloc-documents > .paragraph p'
    ).outerHeight();

    if ($(window).width() > mobileWidth) {
      if (firstBlocP > secondBlocP) {
        $(
          '.bloc.documents .document.last .content-bloc-documents > .paragraph'
        ).height(
          $(
            '.bloc.documents .document .content-bloc-documents > .paragraph > p'
          ).outerHeight()
        );
        $(
          '.bloc.documents .document .content-bloc-documents > .paragraph'
        ).height(
          $(
            '.bloc.documents .document .content-bloc-documents > .paragraph > p'
          ).outerHeight()
        );
      } else {
        $(
          '.bloc.documents .document.last .content-bloc-documents > .paragraph'
        ).height(
          $(
            '.bloc.documents .document.last .content-bloc-documents > .paragraph > p'
          ).outerHeight()
        );
        $(
          '.bloc.documents .document .content-bloc-documents > .paragraph'
        ).height(
          $(
            '.bloc.documents .document.last .content-bloc-documents > .paragraph > p'
          ).outerHeight()
        );
      }
    } else {
      $(
        '.bloc.documents .document .content-bloc-documents > .paragraph'
      ).removeAttr('style');
    }
  },

  init: function() {
    /* FIRST LOAD */
    /* GET DATA FOR WEB SERVICE GLOBAL */
    $.ajax({
      url: webServiceGlobalUrl,
      type: 'get',
      dataType: 'json',
      success: function(data) {
        /* STOCK IN GLOBAL VARIABLE */
        myDataWebServiceGlobal = data;

        /* ON LOAD */
        /* PUSH YEAR FOR FIRST TRAVELLER */
        $('select[name="year_birth_traveller_1"]')
          .html(htmlYear)
          .selectric('refresh');

        $('select[name="year_departure_date_traveller_1"]')
          .html(htmlYearArrival)
          .selectric('refresh');

        /* STOCK DATA INTO VARIABLE */
        expPhoneNumber = data.phone_number_format;
        countryCode = data.country_code;
        countryName = data.country_name;
        destinationCountryCode = data.destination_country_code;
        destinationCountryName = data.destination_country_name;
        currencyCode = data.currency_code;
        currencyName = data.currency_name;
        termsAndConditonsUrl = data.terms_and_conditions_url;
        sessionId = data.session_id;

        /* AREA LIST */
        var htmlArea = '';
        for (var i = 0; i < data.capago_center_list.length; i++) {
          var center = data.capago_center_list[i];

          /* CONSTRUCT HTML FOR LIST AND FORMULA */
          var checked = '';
          if (i === 0) {
            checked = 'checked';
          }

          htmlArea += '<div>';
          htmlArea +=
            '<input id="area_' +
            center.capago_center_city +
            '" type="radio" value="' +
            center.capago_center_id +
            '" name="area" data-name-area="' +
            center.capago_center_city +
            '" ' +
            checked +
            '>';
          htmlArea +=
            '<label for="area_' +
            center.capago_center_city +
            '">' +
            center.capago_center_selection_tip_html +
            '</label>';
          htmlArea += '</div>';
        }

        booking.calendar_controller = new CalendarController({
          webServiceDateUrl: webServiceDateUrl,
          webServiceTimeUrl: webServiceTimeUrl
        });

        /* CHANGE DATA FOR FIRST CENTER IN BIO & FORMULA */
        booking.changeArea(0);
        booking.changeService(
          data.capago_center_list[0].capago_center_id,
          true
        );

        /* CHANGE COLOR OF ICON ONLY FOR ITALIA */
        if (destinationCountryCode === 'IT') {
          colorHexa = '006b34';

          /* CHANGE ICON COLOR ONLY FOR ITA */
          booking.changeIcon();

          /* CHANGE IMAGE FOR ID PHOTOS */
          $(
            'fieldset[data-step="3"] .step-container-data .bloc.documents .document:not(.last) .content-bloc-documents img'
          ).attr('src', '../img/portrait-photo-ita.jpg');
        } else {
          colorHexa = '0a57a5';
        }

        /* DISPLAY NON AREA IF ONLY ONT */
        if (data.capago_center_list.length == 1) {
          $('[data-bloc="area"]').hide();
        }

        /* PUSH DATA */
        $('[data-html="area"]').append(htmlArea);
        $('[data-html="session_id"]').val(sessionId);
        $('[data-html="cgv"]').attr('href', termsAndConditonsUrl);
        $('[data-html="currency"]').html(currencyCode);
      }
    });

    /* GET DATA FOR WEB SERVICE SOCIAL TITLE */
    /* PUSH DYNAMIC DATA FOR TITLE */
    $.ajax({
      url: webServiceSocialList,
      type: 'get',
      dataType: 'json',
      success: function(data) {
        /* STOCK OBJECT INTO VARIABLE */
        myObjectTitleList = data;

        var dataList = data.social_title_list;
        var htmlList = '<option value="" selected>- -</option>';

        for (var i = 0; i < dataList.length; i++) {
          htmlList +=
            '<option value="' +
            dataList[i].id +
            '">' +
            dataList[i].title +
            '</option>';
        }

        $(
          'fieldset.step-container[data-step="2"] .step-container-data .traveller-details .traveller-details-form .field-wrapper[data-input="title"] select[name="title_traveller_1"]'
        )
          .html(htmlList)
          .selectric('refresh');
        $(
          'fieldset.step-container[data-step="3"] .step-container-data .bloc.delivery .field-wrapper[data-input="title"] select[name="title_delivery_contact"]'
        )
          .html(htmlList)
          .selectric('refresh');
      }
    });

    /* GET DATA FOR WEB SERVICE VISA FILE VARIATION TITLE */
    /* PUSH DYNAMIC DATA FOR TITLE */
    $.ajax({
      url: webVisaFileVariationList,
      type: 'get',
      dataType: 'json',
      success: function(data) {
        var dataList = data.visa_file_variation_list;
        var htmlList = '<option value="" selected>- -</option>';

        for (var i = 0; i < dataList.length; i++) {
          htmlList +=
            '<option value="' +
            dataList[i].id +
            '">' +
            dataList[i].title +
            '</option>';
        }

        $(
          'fieldset.step-container[data-step="2"] .step-container-data .traveller-details .traveller-details-form .field-wrapper[data-input="visa-file-variation"] select[name="visa_file_variation_traveller_1"]'
        )
          .html(htmlList)
          .selectric('refresh');
      }
    });

    /* VALIDATION FORM */
    booking.step1();
    booking.step2();
    booking.step3();
    booking.step4();

    /* OTHERS FUNCTIONS FOR FORM */
    booking.isNumber();
    booking.isSelect();
    booking.isSms();
    booking.pickadate();
    booking.changeFormula();
    booking.changeIconPassport();
    booking.clickArea();

    booking.deliveryDetailsFormInvoice();
    booking.followBySms();
    booking.deliveryVisa();
    booking.photosPortrait();
    booking.addTravellersOptions();
    booking.isEditStep();

    booking.hoverPopup();
    booking.openPopup();
    booking.closePopup();

    /* OTHERS FUNCTIONS FOR DESIGN */
    booking.border();
    booking.documents();
  }
};
