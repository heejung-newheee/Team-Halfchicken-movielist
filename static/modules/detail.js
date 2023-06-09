import { OPTIONSDETAIL } from './options.js';
import { OPTIONS2 } from './options.js';
import { fetchDelete } from './fetchdelete.js';
import { fetchMongoReviews } from './fetchmongoreviews.js';
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
import { countries } from './countries.js';
import { makeDetailMovieInfo } from './makedetailmovieinfo.js';
import { moveSlide } from './moveslide.js';
import { toggleBtn } from './togglebtn.js';
import { appendGenre } from './makegenre.js';

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
  const movie = await fetchDetail(para);
  const { enTitle, runtime, title, vote_average } = movie;
  const poster_path = `https://image.tmdb.org/t/p/w500/${movie['poster_path']}`;
  const release_date = movie['release_date'].replace(/-/g, '.');
  const movieYear = movie['release_date'].substr(0, 4);

  let overview = ``;
  if (movie['overview'] === '') {
    overview = `줄거리 정보가 없습니다.`;
  } else {
    overview = movie['overview'];
  }
  let genres = ``;
  if (movie['genres'].length >= 2) {
    genres = `${movie['genres'][0]['name']}/${movie['genres'][1]['name']}`;
  } else {
    genres = `${movie['genres'][0]['name']}`;
  }
  let production_countries = countries(movie);
  makeDetailMovieInfo(title, movieYear, enTitle, release_date, runtime, production_countries, overview, poster_path, vote_average, genres);
}

async function fetchMovie() {
  const response = await fetch(URL, OPTIONSDETAIL);
  const data = await response.json();
  const movies = data.results;
  return movies;
}

async function listGenreMovie() {
  const movies = await fetchMovie();
  const movie = await fetchDetail(para);
  const movieId = movie.id;
  const movieGenre = [];
  for (var a of movie['genres']) {
    movieGenre.push(a.id);
  }
  const result2 = appendGenre(movies, movieId, movieGenre);
  slidShow(result2);
}

// ** take the movie id from this page **
const para = document.location.href.split('contentId')[1];

fetchDetail(para);
listDetailMovie();
listGenreMovie();

async function slidShow(datas) {
  let movies = await datas;
  moveSlide(movies);
}

async function listingAllReview() {
  try {
    let tmdbReviews = await fetchTmdbReview();
    makeTmdbList(tmdbReviews);
    let mongoReviews = await fetchMongoReviews();
    let matchReview = mongoReviews.filter(item => {
      return item.movie === para;
    });
    makeMongoList(matchReview);
  } catch (error) {
    throw new Error(`에러가 발생: ${error.message}`);
  }
}
listingAllReview();

const reviewForm = document.review;
reviewForm.addEventListener('submit', e => {
  e.preventDefault();
  postReview();
});

async function postReview() {
  let validation = validationCheck();
  fetchPostReview(validation, para);
}

const commentArea = document.querySelector('.comment-list ul');
const editDeleteBtn = document.querySelector('.edit-delete-btn');
const editFinishBtn = document.querySelector('.edit-finish-btn');
const editCancleBtn = document.querySelector('.edit-cancle-btn');
commentArea.addEventListener('click', deleteReview);
commentArea.addEventListener('click', clickEditBtn);
editDeleteBtn.addEventListener('click', clickDeleteBtn);
editFinishBtn.addEventListener('click', editReview);
editCancleBtn.addEventListener('click', () => {
  toggleBtn();
  nameInput.removeAttribute('disabled');
  nameInput.style.filter = 'brightness(1)';
});

async function deleteReview(e) {
  try {
    if (e.target.className !== 'del-btn') return false;
    let _id = e.target.closest('li').getAttribute('id');
    let userPw = prompt('비밀번호를 입력해 주세요');
    let checkPwResult = await checkPw(_id, userPw);
    fetchDelete(checkPwResult, _id);
  } catch (error) {
    throw new Error(`에러가 발생: ${error.message}`);
  }
}

let editReviewId = null;
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

async function clickDeleteBtn() {
  try {
    let userPw = pwInput.value;
    if (!userPw) {
      alert('비밀번호를 입력해 주세요');
      return false;
    }
    let checkPwResult = await checkPw(editReviewId, userPw);
    fetchDelete(checkPwResult, editReviewId);
  } catch (error) {
    throw new Error(`에러가 발생: ${error.message}`);
  }
}

async function editReview() {
  try {
    if (!pwInput.value) {
      alert('비밀번호를 입력해 주세요');
      return false;
    } else if (!commentInput.value) {
      alert('한줄평을 입력해 주세요');
      return false;
    }
    let userpw = pwInput.value;
    let checkPwResult = await checkPw(editReviewId, userpw);
    fetchEditReview(checkPwResult, editReviewId);
  } catch (error) {
    throw new Error(`에러가 발생: ${error.message}`);
  }
}

async function fetchTmdbReview() {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${para}/reviews?language=en-US&page=1`, OPTIONS2);
    const data = await response.json();
    const reviews = data.results;
    return reviews;
  } catch (error) {
    throw new Error(`에러가 발생: ${error.message}`);
  }
}

document.querySelector('.story-more-btn').addEventListener('click', () => {
  document.querySelector('.story-second >p').classList.remove('movie-story-close');
  document.querySelector('.story-more-btn').style.display = 'none';
});
document.querySelector('.show-shareBtn').addEventListener('mouseover', () => {
  document.querySelector('.share-box').classList.remove('none');
});
document.querySelector('.share-box').addEventListener('mouseover', () => {
  document.querySelector('.share-box').classList.remove('none');
});
document.querySelector('.show-shareBtn').addEventListener('mouseout', () => {
  document.querySelector('.share-box').classList.add('none');
});
document.querySelector('.share-box').addEventListener('mouseout', () => {
  document.querySelector('.share-box').classList.add('none');
});

const thisUrl = document.location.href;
const copyURL = async function () {
  try {
    await navigator.clipboard.writeText(thisUrl);
    alert('현재 위치한 URL이 복사되었습니다!');
  } catch (error) {
    throw new Error(`Failed to copy: ${error.message}`);
  }
};
document.querySelector('.copythisURL > button').addEventListener('click', copyURL);

const shareFacebook = () => window.open('http://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(thisUrl));
document.querySelector('.facebookImg').addEventListener('click', shareFacebook);

const shareTwitter = async () => {
  try {
    const movie = await fetchDetail(para);
    const thisTitle = movie['title'];
    window.open(`http://twitter.com/intent/tweet?text='영화 "${thisTitle}" 반드시 구경하러오세유'&url=${thisUrl}`);
  } catch (error) {
    throw new Error(`Failed to share: ${error.message}`);
  }
};
document.querySelector('.twitterImg').addEventListener('click', shareTwitter);

const shareNaver = async () => {
  try {
    const movie = await fetchDetail(para);
    const thisTitle = movie['title'];
    const naverShareAPI = encodeURI(`https://share.naver.com/web/shareView?url=${thisUrl}&title=${thisTitle}`);
    window.open(naverShareAPI);
  } catch (error) {
    throw new Error(`Failed to share: ${error.message}`);
  }
};
document.querySelector('.NaverImg').addEventListener('click', shareNaver);

if (!Kakao.isInitialized()) {
  Kakao.init('f6b9ec2f54f02b2bfb924e9beba10669');
}

let sendKakao = async function () {
  const movie = await fetchDetail(para);
  const title = movie['title'];
  const poster = `https://image.tmdb.org/t/p/w500/${movie['poster_path']}`;

  Kakao.Link.sendDefault({
    objectType: 'feed',
    content: {
      title: `${title}`,
      description: `"${title}" 아직 안봤어? 꿀잼이라구! 들어와서 조금 더 살펴봐!`,
      imageUrl: `${poster}`,
      link: {
        webUrl: thisUrl,
        mobileWebUrl: thisUrl,
      },
    },
  });
};
document.querySelector('.kakaoImg').addEventListener('click', sendKakao);
