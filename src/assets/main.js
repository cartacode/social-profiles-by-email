// Get sesssion data from localStorage
var LOCAL_STORAGE_KEY = 'bp_session';
var sessionData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
sessionData = sessionData ? JSON.parse(sessionData) : {submissions: 0, email: false};

/*
 * On email modal submit handler
 */
function onEmailSubmit(e) {

    e.preventDefault();

    // Get data from form
    var data = buildData(e.target);

    if (!validate(data)) {
        return
    }

    // Disable form
    $('#email-capture input').attr('disabled', true);
    $('#email-capture button').attr('disabled', true);

    // $('#result').html;
    data.type = 'Email Finder';

    $.ajax({
        url: "https://7umdo22ge3.execute-api.us-west-2.amazonaws.com/dev/email",
        method: "POST",
        data: JSON.stringify(data),
        timeout: 20000,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
    })
        .done(function (data) {

            $('#email-capture input').attr('disabled', false);
            $('#email-capture button').attr('disabled', false);

            // Set that email has been submitted
            sessionData.email = true;

            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessionData));

            $('#modal1').modal('close');
        })
        .fail(function (err) {

            $('#email-capture input').attr('disabled', false);
            $('#email-capture button').attr('disabled', false);
        });

    return false;
}

/*
 * Validate the form
 *
 * - Check that fields aren't empty, if so add invalid class
 */
function validate(data) {
    var valid = true;

    for (var key in data) {
        var input = $("input[name='" + key + "']");

        if (!data[key] && key != 'middle_name') {
            valid = false;
            input.addClass('invalid');
        }
        else {
            input.removeClass('invalid');
        }
    }

    return valid;
}

/*
 * Build data
 *
 * - Serialize form and build object
 */
function buildData(form) {
    return $(form).serializeArray().reduce(function (obj, item) {
        obj[item.name] = item.value.trim();

        if (obj[item.name]) {
            obj[item.name] = item.value.toLowerCase();
        }
        return obj;
    }, {});
}

/*
 * On submit handler
 */
function onSubmit(e) {

    e.preventDefault();

    // Get data from form
    var data = buildData(e.target);

    if (!validate(data)) {
        return
    }
    post(data, e, '/v1/profiles/find')
        .done(function (data) {
            console.log(data)
            if (data.email.constructor === Array && data.email.length > 1) {
                $('#result').html(' Not Sure! Most likely to be one among the following:');
            } else {
                $('#result').html('Success! The email is:');
            }
            $('.success-form').addClass('show');

            $('#single-result').append('<tr><th>Name</th><td>' + toTitleCase(data.full_name) + '</td></tr>');
            $('#single-result').append('<tr><th>Email</th><td><input type="text" value="" id="success_field" class=""><button id="copy-button" class="btn waves-effect waves-light btn-small" onclick="copyToClipboard()">Copy e-mail</button></td><td></td></tr>');
            $('#success_field').val(data.email);


            // $('#single-result').append('<tr><th>Current position</th><td>' + data.current_position + '</td></tr>');
            // $('#single-result').append('<tr><th>Location</th><td>' + data.location + '</td></tr>');
            if (data.twitter_url) $('.icons-bar').append('<a target="_blank" rel="noopener noreferrer" href="' + data.twitter_url + '" class="twitter"><i class="fa fa-twitter"></i></a>');
            if (data.facebook_url) $('.icons-bar').append('<a target="_blank" rel="noopener noreferrer" href="' + data.facebook_url + '" class="facebook"><i class="fa fa-facebook"></i></a>');
            if (data.linkedin_url) $('.icons-bar').append('<a target="_blank" rel="noopener noreferrer" href="' + data.linkedin_url + '" class="linkedin"><i class="fa fa-linkedin"></i></a>');
            if (data.angellist_url) $('.icons-bar').append('<a target="_blank" rel="noopener noreferrer" href="' + data.angellist_url + '" class="angellist"><i class="fa fa-angellist"></i></a>');
            if (data.instagram_url) $('.icons-bar').append('<a target="_blank" rel="noopener noreferrer" href="' + data.instagram_url + '" class="instagram"><i class="fa fa-instagram"></i></a>');

        })
        .fail(function (data) {
            $('#results-table').html('');
            $('#result').html('There was a problem finding the email.');
        })
}


function post(data, e, url) {

    var loadingCover = $('.loading-cover');
    // Show loading screen
    $('.success-form').removeClass('show');
    loadingCover.addClass('show');

    // Clear old result
    $('#result').html('');
    $('#single-result').html('');
    $('#results-table').html('');
    $('.icons-bar').html('');
    console.log('aaaa=', data, url)
    return $.ajax({
        url: url,
        method: "POST",
        data: JSON.stringify(data),
        timeout: 200000,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
    })
        .done(function (data) {
            // Hide loading screen
            loadingCover.removeClass('show');
        })
        .fail(function (err) {
            // Hide loading screen
            loadingCover.removeClass('show');
        });

    return false;
}

function copyToClipboard() {
    var copyText = document.getElementById("success_field");
    copyText.select();
    document.execCommand("copy");
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function readFile() {

    hashCode = function(s){
        return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
    }

    output = [];

    function parseAndRequest(csv) {
        csv = csv.replace(/(?:\\[rn]|[\r\n]+)+/g, '\n');
        var lines = csv.split("\n");
        var result = [];
        console.log(lines)
        for (var i = 1; i < lines.length; i++) {
            console.log(' iterate : ', i)
            // var obj = {};
            var currentline = lines[i].split(",");

            obj = {
                first_name: currentline[0],
                middle_name: currentline[1],
                last_name: currentline[2],
                domain: currentline[3]
            };

            post(obj, null, '/v1/profiles/find')
                .done(function (data) {
                    // if ($('#results-table').is(':empty')) {
                    //     $('#results-table').append('<tr><th>Name</th><th>Email Address</th></tr>');
                    // }
                    // $('#results-table tr:last').after('<tr><th>' + toTitleCase(data.full_name) + '</th><th>' + data.email + '</th></tr>');

                    console.log(output.length + "----" + lines.length - 1);
                    // output.push({name: data.full_name, email: data.email})
                    output.push([data.full_name, data.email]);
                    if (output.length === lines.length - 1) {
                        console.log('finished');
                        console.log(output);

                        let csvContent = "data:text/csv;charset=utf-8,";
                        output.forEach(function (rowArray) {
                            let row = rowArray.join(",");
                            csvContent += row + "\n";
                        });
                        var encodedUri = encodeURI(csvContent);
                        var link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "output.csv");
                        link.textContent="Click here to download your results";
                        document.body.appendChild(link);
                        $('#result-div').append(link);
                        // link.click();

                    }

                })
                .fail(function (data) {
                    if ($('#results-table').is(':empty')) {
                        $('#results-table').append('<tr><th>Name</th><th>Email Address</th>/tr>');
                    }
                });

            console.log(' number one : ', obj)
            result.push(obj);
        }
        console.log('@@@@: ', result)
        return result; //JSON
    }

    // var pass = prompt("Enter password to use this feature");

    // console.log(hashCode(pass));
    // if(hashCode(pass) === -418368139){

        var file = document.getElementById('file-input').files[0];
        //check file type
        if (file.type == "application/vnd.ms-excel" || file.type == "text/csv") {
            reader = new FileReader();
            reader.onload = function (e) {
                var text = reader.result;
                var json = parseAndRequest(text);
            };
            reader.readAsText(file)
        } else {
            alert("File format not supported")
        }


    // }else{
    //     alert("Not authorized")
    // }

}


function uploadFile() {
    // Form Data
    var formData = new FormData();

    var fileSelect = document.getElementById("file-input");
    if(fileSelect.files && fileSelect.files.length == 1){
     var file = fileSelect.files[0]
     formData.set("file", file , file.name);
    }

    // Http Request  
    var request = new XMLHttpRequest();
    request.open('POST', "http://localhost:5050/v1/profiles/csv_upload");
    request.send(formData);
}


/*
 * Initialize
 */
function init() {

    $('#email-form').on('submit', onSubmit);
    $('#email-capture').on('submit', onEmailSubmit);

    $(".button-collapse").sideNav();

    $('.modal').modal({
            dismissible: false, // Modal can be dismissed by clicking outside of the modal
            opacity: .5, // Opacity of modal background
            in_duration: 300, // Transition in duration
            out_duration: 200, // Transition out duration
            starting_top: '4%', // Starting top style attribute
            ending_top: '10%', // Ending top style attribute
        }
    );

}

$(document).ready(init);




