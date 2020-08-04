var input=document.getElementsByClassName("bodyInput")[0]
var icon=document.getElementById("icon")
var isExpanded=false;
icon.addEventListener("click",function(){
    if(isExpanded){
        icon.setAttribute("class","fa fa-plus")
        input.setAttribute("type","hidden")
    }
    else{
        icon.setAttribute("class","fa fa-minus")
        input.setAttribute("type","text")
        input.focus();
    }
    isExpanded=!isExpanded;
})