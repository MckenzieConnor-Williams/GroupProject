const flashcard = document.getElementById("flashcard");

let showQuestion = true;

flashcard.addEventListener("click", function()
{
    if(showQuestion)
    {
        flashcard.textContent = "Central Processing Unit";
        showQuestion = false;
    }
    else 
    {
        flashcard.textContent = "What does CPU Stand for?"
        showQuestion = true;
    }
});
