let studyTool = document.getElementById("studytool");
let studyToolDiv = document.getElementById("dropdown-div-studytools");

let topics = document.getElementById("topics");
let topicsDiv = document.getElementById("dropdown-div-topics");

let signupBtn = document.getElementById("signup-btn");

signupBtn.onclick = function(){
    window.location.href = "signup.html";
}

studyTool.onclick = function(){
    if(studyToolDiv.style.display == "block"){
        studyToolDiv.style.display = "none";
    }
    else{
        studyToolDiv.style.display = "block";
        topicsDiv.style.display = "none";
    }
}

topics.onclick = function(){
    if(topicsDiv.style.display == "block"){
        topicsDiv.style.display = "none";
    }
    else{
        topicsDiv.style.display = "block";
        studyToolDiv.style.display = "none";
    }
}

