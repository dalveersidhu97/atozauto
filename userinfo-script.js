
const getUserInfo1 = () => {
    const navbar = document.querySelector('#navbar-menu');
    const img = navbar.querySelector(`img[alt="User's avatar"]`);
    const name = img.parentElement.parentElement.innerText;
    console.log(name, img.getAttribute('src'));
    return { name, img: img.getAttribute('src') }
}

const setUserInfo1 = () => {
    const userInfo = getUserInfo1();
    chrome.storage.local.get(null, function (result) {
        chrome.storage.local.set({ ...result, userInfo });
    });
}
setUserInfo1();