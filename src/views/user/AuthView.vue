<template>
    <div class="auth-container">
        <div class="auth-box">
            <div class="auth-image">
                <div class="overlay"></div>
                <img src="@/assets/icons/land.jpg" alt="Land">
            </div>
            <div class="auth-form">
                <h2>Добро пожаловать</h2>
                <div v-if="isLogin">
                    <form @submit.prevent="handleLogin">
                        <n-form-item label="Почта" :feedback="emailError">
                            <n-input type="email" v-model:value="email" placeholder=" " required
                                @blur="validateEmail" />
                        </n-form-item>
                        <n-form-item label="Пароль" :feedback="passwordError">
                            <n-input type="password" v-model:value="password" placeholder=" " required
                                @blur="validatePassword" />
                        </n-form-item>
                        <n-button type="info" block @click="handleLogin" class="auth-button">Войти</n-button>
                    </form>
                    <p><strong class="text-gray">Впервые в календаре?</strong> <a
                            @click="toggleForm">Зарегистрироваться</a></p>
                </div>
                <div v-else>
                    <form @submit.prevent="handleRegister">
                        <n-form-item label="ФИО" :feedback="fullNameError">
                            <n-input type="text" v-model:value="fullName" placeholder=" " required
                                @blur="validateFullName" />
                        </n-form-item>
                        <n-form-item label="Почта" :feedback="emailError">
                            <n-input type="email" v-model:value="email" placeholder=" " required
                                @blur="validateEmail" />
                        </n-form-item>
                        <n-form-item label="Пароль" :feedback="passwordError">
                            <n-input type="password" v-model:value="password" placeholder=" " required
                                @blur="validatePassword" />
                        </n-form-item>
                        <n-form-item label="Подтвердите пароль" :feedback="confirmPasswordError">
                            <n-input type="password" v-model:value="confirmPassword" placeholder=" " required
                                @blur="validateConfirmPassword" />
                        </n-form-item>
                        <n-button type="info" block @click="handleRegister" class="auth-button">Создать
                            аккаунт</n-button>
                    </form>
                    <p><strong class="text-gray">Есть аккаунт?</strong> <a @click="toggleForm">Вход</a></p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { NButton, NInput, NFormItem, useMessage } from 'naive-ui';

const isLogin = ref(true);
const email = ref('');
const password = ref('');
const fullName = ref('');
const confirmPassword = ref('');

const emailError = ref('');
const passwordError = ref('');
const confirmPasswordError = ref('');
const fullNameError = ref('');

const message = useMessage();
const router = useRouter();

const toggleForm = () => {
    isLogin.value = !isLogin.value;
    emailError.value = '';
    passwordError.value = '';
    confirmPasswordError.value = '';
    fullNameError.value = '';
};

const validateEmail = () => {
    if (!email.value.includes('@')) {
        emailError.value = 'Адрес электронной почты должен содержать символ «@»';
    } else {
        emailError.value = '';
    }
};

const validatePassword = () => {
    const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!re.test(password.value)) {
        passwordError.value = 'Пароль должен содержать как минимум одну цифру, одну заглавную букву, одну строчную букву и быть длиной не менее 8 символов';
    } else {
        passwordError.value = '';
    }
};

const validateConfirmPassword = () => {
    if (password.value !== confirmPassword.value) {
        confirmPasswordError.value = 'Пароли не совпадают';
    } else {
        confirmPasswordError.value = '';
    }
};

const validateFullName = () => {
    if (!fullName.value) {
        fullNameError.value = 'Поле ФИО не должно быть пустым';
    } else {
        fullNameError.value = '';
    }
};

const handleLogin = async () => {
    validateEmail();
    validatePassword();

    if (emailError.value || passwordError.value) {
        return;
    }

    try {
        const response = await axios.post('http://localhost:3000/login', {
            email: email.value,
            password: password.value
        }, { withCredentials: true });
        const { accountType } = response.data;

        message.success('Производится авторизация...');
        if (accountType === 'admin') {
            router.push('/admin');
        } else if (accountType === 'teacher') {
            router.push('/teacher');
        } else {
            router.push('/student');
        }
    } catch (error) {
        console.error('Ошибка входа:', error.response.data.error);
        message.error('Ошибка входа: ' + error.response.data.error);
    }
};

const handleRegister = async () => {
    validateFullName();
    validateEmail();
    validatePassword();
    validateConfirmPassword();

    if (emailError.value || passwordError.value || confirmPasswordError.value || fullNameError.value) {
        return;
    }

    try {
        const response = await axios.post('http://localhost:3000/register', {
            email: email.value,
            password: password.value,
            fullName: fullName.value
        });
        console.log('Регистрация выполнена:', response.data);
        message.success('Регистрация выполнена!');
        setTimeout(() => {
            toggleForm();
        }, 2000);
    } catch (error) {
        console.error('Ошибка регистрации:', error.response.data.error);
        message.error('Ошибка регистрации: ' + error.response.data.error);
    }
};
</script>

<style scoped>
.auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f5f5f5;
}

.auth-box {
    display: flex;
    width: 1100px;
    height: 700px;
    background-color: #ffffff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.auth-image {
    position: relative;
    width: 50%;
    height: 100%;
    overflow: hidden;
}

.auth-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.auth-image .overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgba(128, 0, 128, 0.3);
}

.auth-form {
    width: 50%;
    padding: 50px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
}

.auth-form h2 {
    margin-bottom: 20px;
    text-align: center;
    font-size: 28px;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
}

.n-form-item {
    margin-bottom: 5px;
}

.n-form-item label {
    font-weight: bold;
    font-size: 18px;
}

.n-input {
    height: 120%;
    background-color: #f7f7f7;
}

.n-button {
    font-weight: bold;
}

.auth-button {
    width: 250px;
    margin: 20px auto 0;
    font-size: 18px;
    height: 35px;
    font-weight: bold;
}

p {
    text-align: center;
    font-size: 18px;
}

.text-gray {
    color: gray;
    font-weight: bold;
}

p a {
    color: #007bff;
    cursor: pointer;
    font-size: 18px;
}

p a:hover {
    text-decoration: underline;
}
</style>