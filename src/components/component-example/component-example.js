function example() {
    const messageElement = document.getElementById('js');
    messageElement.textContent = 'Я тут, JS скрипт!';
    messageElement.style.opacity = 0;
    let opacity = 0;
    const fadeIn = setInterval(() => {
        opacity += 0.05;
        messageElement.style.opacity = opacity;
        if (opacity >= 1) {
            clearInterval(fadeIn);
            console.log('Я тут, JS скрипт!');
        }
    }, 50);
}

example();