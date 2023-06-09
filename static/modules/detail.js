import { OPTIONSDETAIL } from './options.js';
import { OPTIONS2 } from './options.js';
import { fetchDelete } from './fetchdelete.js';
import { getMongoReviews } from './getmongoreviews.js';
import { fetchPostReview } from './fetchpostreview.js';
import { fetchEditReview } from './fetcheditreview.js';
import { makeMongoList } from './makemongolist.js';
import { makeTmdbList } from './maketbdblist.js';
import { checkPw } from './checkpw.js';
import { validationCheck } from './validationcheck.js';
import { checkDB } from './checkdb.js';
import { nameInput, commentInput, pwInput } from './input.js';
import { moveToEditForm } from './movetoeditform.js';
import { scrollTop } from './common.js';
import { URL } from './fetchurl.js';
import { makeDetailMovieInfo } from './makedetailmovieinfo.js';
import { moveSlide } from './moveslide.js';
import { shareboxRemove, shareboxAdd, shareBoxBtn, shareBox } from './shareBox.js';

//  Top btn
const $topBtn = document.querySelector('aside nav button');
$topBtn.addEventListener('click', scrollTop);

// jieun
async function fetchDetail(movieId) {
  const mostResponse = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?language=ko-KR`, OPTIONSDETAIL);
  const mostData = await mostResponse.json();
  const enTitleResponse = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?language=en-US`, OPTIONSDETAIL);
  const forEnData = await enTitleResponse.json();
  const enTitle = forEnData['title'];
  mostData['enTitle'] = enTitle;

  return mostData;
}

async function listDetailMovie() {
  const movie = await fetchDetail(PARA);
  makeDetailMovieInfo(movie);
}

async function fetchMovie() {
  const response = await fetch(URL, OPTIONSDETAIL);
  const data = await response.json();
  const movies = data.results;
  return movies;
}

async function listGenreMovie() {
  const movies = await fetchMovie();
  const movie = await fetchDetail(PARA);
  const movieId = movie.id;
  const movieGenre = [];
  for (var a of movie['genres']) {
    movieGenre.push(a.id);
  }
  let result2 = [];
  movies.forEach(movies => {
    const { id, genre_ids, title, poster_path } = movies;
    const contentId = `${id}`;
    const genreSection = document.querySelector('.items');
    const innerli = document.createElement('li');
    const img = document.createElement('img');
    const p = document.createElement('p');

    innerli.setAttribute('class', 'genre-card');
    img.setAttribute('class', 'card-image');
    img.setAttribute('src', `https://image.tmdb.org/t/p/w500/${poster_path}`);
    img.setAttribute('alt', title);
    p.setAttribute('class', 'card-title');
    p.innerText = title;

    innerli.appendChild(img);
    innerli.appendChild(p);

    innerli.addEventListener('click', () => {
      location.href = '/detail.html?contentId' + contentId;
    });
    const result = movieGenre.filter(x => genre_ids.includes(x));
    if (result.length >= 1 && movieId != contentId) {
      genreSection.appendChild(innerli);
      result2.push(result);
    }
  });
  slidShow(result2);
}

// ** take the movie id from this page **
const PARA = document.location.href.split('contentId')[1];

fetchDetail(PARA);
listDetailMovie();
listGenreMovie();

async function slidShow(datas) {
  let movies = await datas;
  moveSlide(movies);
}

const reviewForm = document.review;
reviewForm.addEventListener('submit', e => {
  e.preventDefault();
  postReview();
});

async function postReview() {
  let validation = validationCheck();
  fetchPostReview(validation, PARA);
}

const commentArea = document.querySelector('.comment-list ul');
async function listingMongoReviews() {
  const reviews = await getMongoReviews();
  const matchReview = reviews.filter(item => {
    return item.movie === PARA;
  });
  makeMongoList(matchReview);
}
listingMongoReviews();

commentArea.addEventListener('click', deleteReview);
async function deleteReview(e) {
  if (e.target.className !== 'del-btn') return false;
  let _id = e.target.closest('li').getAttribute('id');
  let userPw = prompt('비밀번호를 입력해 주세요');
  let checkPwResult = await checkPw(_id, userPw);
  fetchDelete(checkPwResult, _id);
}
let editReviewId = null;
commentArea.addEventListener('click', clickEditBtn);
function clickEditBtn(e) {
  if (e.target.className !== 'edit-btn') return false;
  let _id = e.target.closest('li').getAttribute('id');
  editReviewId = _id;
  checkDB(_id, e.target);
  toggleBtn('edit-btn');
  moveToEditForm();
  nameInput.setAttribute('disabled', true);
  nameInput.style.filter = 'brightness(0.8)';
}

const editDeleteBtn = document.querySelector('.edit-delete-btn');
editDeleteBtn.addEventListener('click', clickDeleteBtn);
async function clickDeleteBtn() {
  let userPw = pwInput.value;
  if (!userPw) {
    alert('비밀번호를 입력해 주세요');
    return false;
  }
  let checkPwResult = await checkPw(editReviewId, userPw);
  fetchDelete(checkPwResult, editReviewId);
}

const editFinishBtn = document.querySelector('.edit-finish-btn');
editFinishBtn.addEventListener('click', editReview);
async function editReview() {
  if (!pwInput.value) {
    alert('비밀번호를 입력해 주세요');
    return false;
  } else if (!commentInput.value) {
    alert('한줄평을 입력해 주세요');
    return false;
  }
  let userpw = pwInput.value;
  let checkPwResult = await checkPw(editReviewId, userpw);
  await fetchEditReview(checkPwResult, editReviewId);
}

const editCancleBtn = document.querySelector('.edit-cancle-btn');
editCancleBtn.addEventListener('click', () => {
  toggleBtn();
  nameInput.removeAttribute('disabled');
  nameInput.style.filter = 'brightness(1)';
});

function toggleBtn(btn) {
  const submitBtn = document.querySelector('.submit-btn');
  if (btn) {
    editFinishBtn.classList.add('btn-active');
    editDeleteBtn.classList.add('btn-active');
    editCancleBtn.classList.add('btn-active');
    submitBtn.classList.remove('btn-active');
  } else {
    editFinishBtn.classList.remove('btn-active');
    editDeleteBtn.classList.remove('btn-active');
    editCancleBtn.classList.remove('btn-active');
    submitBtn.classList.add('btn-active');
  }
}

const listingTMDBReview = async payload => {
  let res = await payload;
  let reviews = res.results;
  makeTmdbList(reviews);
};

async function fetchTmdbReview() {
  const response = await fetch(`https://api.themoviedb.org/3/movie/${PARA}/reviews?language=en-US&page=1`, OPTIONS2);
  const data = await response.json();
  return data;
}
let tmdbReviews = fetchTmdbReview();
listingTMDBReview(tmdbReviews);

shareBoxBtn.addEventListener('mouseover', shareboxAdd);
shareBox.addEventListener('mouseover', shareboxAdd);
shareBoxBtn.addEventListener('mouseout', shareboxRemove);
shareBox.addEventListener('mouseout', shareboxRemove);

const moreStoryBtn = document.querySelector('.story-more-btn');
moreStoryBtn.addEventListener('click', () => {
  document.querySelector('.story-second >p').classList.remove('movie-story-close');
  moreStoryBtn.style.display = 'none';
});

const THISURL = document.location.href;
const copyURL = async function () {
  try {
    await navigator.clipboard.writeText(THISURL);
    alert('현재 위치한 URL이 복사되었습니다!');
  } catch (error) {
    alert.error('Failed to copy: ', err);
  }
};
document.querySelector('.copythisURL > button').addEventListener('click', copyURL);

const sendFacebook = () => window.open('http://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(THISURL));
document.querySelector('.facebookImg').addEventListener('click', sendFacebook);

const sendTwitter = async () => {
  try {
    const movie = await fetchDetail(PARA);
    const thisTitle = movie['title'];
    window.open(`http://twitter.com/intent/tweet?text='영화 "${thisTitle}" 반드시 구경하러오세유'&url=${THISURL}`);
  } catch (error) {
    alert.error('Failed to share', err);
  }
};
document.querySelector('.twitterImg').addEventListener('click', sendTwitter);

const sendNaver = async () => {
  try {
    const movie = await fetchDetail(PARA);
    const thisTitle = movie['title'];
    const naverShareAPI = encodeURI(`https://share.naver.com/web/shareView?url=${THISURL}&title=${thisTitle}`);
    window.open(naverShareAPI);
  } catch (error) {
    alert.error('Failed to share', err);
  }
};
document.querySelector('.NaverImg').addEventListener('click', sendNaver);

if (!Kakao.isInitialized()) {
  Kakao.init('f6b9ec2f54f02b2bfb924e9beba10669');
}

let sendKakao = async function () {
  const movie = await fetchDetail(PARA);
  const title = movie['title'];
  const poster = `https://image.tmdb.org/t/p/w500/${movie['poster_path']}`;

  Kakao.Link.sendDefault({
    objectType: 'feed',
    content: {
      title: `${title}`,
      description: `"${title}" 아직 안봤어? 꿀잼이라구! 들어와서 조금 더 살펴봐!`,
      imageUrl: `${poster}`,
      link: {
        webUrl: THISURL,
        mobileWebUrl: THISURL,
      },
    },
  });
};
document.querySelector('.kakaoImg').addEventListener('click', sendKakao);
