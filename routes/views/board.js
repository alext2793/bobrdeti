var keystone = require('keystone');
var async = require('async');
var API_KEY = '486b068826a324a87963b1baaba339c4-f8faf5ef-61a4c0ca';
var DOMAIN = 'sandbox5f184d85486a406fa79a2a7520007665.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: API_KEY, domain: DOMAIN});
var Post = keystone.list('Post');
var moment = require('moment');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// Init locals
	locals.section = 'board';
	locals.filters = {
		boardrubric: req.params.boardrubric,
	};
	locals.data = {
		posts: [],
		boardrubrics: [],
		afishaIndex: []
	};

	view.query('afishaRubric', keystone.list('AfishaRubric').model.find().sort('name'));

	view.on('init', function (next) {

		var datenow = moment().format('YYYY-MM-DD');

		var q = keystone.list('Post').model.find({
				state: 'Опубликовать',
				afisha: true,
				meetDate: datenow
		})
			.sort('meetDate')
			.populate('sectionAfisha');

		var w = keystone.list('Post').model.find({
			state: 'Опубликовать',
			afisha: true,
			meetDatePostoyanno: {"$gte": datenow, "$lte": datenow}
		})
			.populate('sectionAfisha');

		if (locals.data.afisharubric) {
			console.log(locals.data.afisharubric);
			q.where('sectionAfisha').in([locals.data.afisharubric]);
			w.where('sectionAfisha').in([locals.data.afisharubric]);
		}

		q.exec(function (err, results) {
			//locals.data.posts = results;
			w.exec(function (error, res){
				res.forEach((arr, i) => {
					results.unshift(arr);
				});
				//console.log(results.results);
				locals.data.afishaIndex = results
				next(err);
			})
		});
	});


	view.query('reklama', keystone.list('Reklama').model.find().where('state', 'Опубликовать').sort('sort'));
	view.query('social', keystone.list('Social').model.find());
	view.query('postCategoryMenu', keystone.list('Rubric').model.find());

	view.on('init', function (next) {
		var q = Post.model.find({
			hotnews: false,
			state: 'Опубликовать',
			news: false,
			afisha: false,
			articl: true
		}).sort('-publishedDate').limit(3);
		q.exec(function (err, results) {

			locals.otherarticlsmenu = results;

			next(err);
		});
	});

	view.on('init', function (next) {
		var q = keystone.list('Post').model.find().where('news', true).where('hotnews', false).where('state', 'Опубликовать').sort('-publishedDate').populate('rubrics').skip(4).limit(3);
		q.exec(function (err, results) {

			locals.othernewsmenu = results;

			next(err);
		});
	});

	view.on('init', function (next) {

		keystone.list('PostCategory').model.find().exec(function (err, result) {
			locals.data.categorymenu = result;
			next(err);
		});
	});

	view.on('post', { action: 'subscription' }, function (next) {

		if (!req.body.subscriber) {
			req.flash('error', { title: 'Ошибка подписки', detail: 'Вы должны ввести адрес электронной почты!' });
			return next();
		}

		if (req.body.subscriber) {
			req.flash('success', { detail: 'Спасибо, Вы удачно подписались на нас.' });

			const mail = {
	      from: 'Новый подписчик на bobrdeti.by <bobrdeti9@gmail.com>',
	      to: 'info@bobrdeti.by',
	      subject: 'Новый подписчик на bobrdeti.by',
	      html:`
	        <div style="display:block;">
	        <br>
	        <img src="https://momportal.herokuapp.com/img/logo.png">
	    		<h2>Новый подписчик</h2>
	    		<ul>
	    		<li><b>E-mail:</b> ${req.body.subscriber}</li>
	    		</ul>
	        </div>`,
	    };

	    mailgun.messages().send(mail, (error, body) => {
	      console.log(body);
	    });

			res.redirect('#');
		}

	});

	view.query('postCategory1', keystone.list('PostCategory').model.find().sort('name').limit(3));
	view.query('postCategory2', keystone.list('PostCategory').model.find().sort('name').skip(3).limit(3));
	view.query('postCategory3', keystone.list('PostCategory').model.find().sort('name').skip(6).limit(3));
	// Load all categories

	view.on('init', function (next) {

		keystone.list('BoardRubric').model.find().sort('name').exec(function (err, results) {

			if (err || !results.length) {
				return next(err);
			}

			locals.data.boardrubrics = results;
			// Load the counts for each category
			async.each(locals.data.boardrubrics, function (boardrubrics, next) {

				keystone.list('Post').model.count().where('boardrubrics').in([boardrubrics.id]).exec(function (err, count) {
					boardrubrics.postCount = count;
					next(err);
				});

			}, function (err) {
				next(err);
			});

		});
	});


	// Load the current category filter
	view.on('init', function (next) {

		if (req.params.boardrubrics) {
			keystone.list('BoardRubric').model.findOne({ key: req.params.boardrubrics }).exec(function (err, result) {
				locals.data.boardrubric = result;
				next(err);
			});
		} else {
			next();

		}
	});


	// Load the posts
	view.on('init', function (next) {

		var q = keystone.list('Post').paginate({
			page: req.query.page || 1,
			perPage: 8,
			maxPages: 3,
			filters: {
				state: 'Опубликовать',
				board: true,
			},
		})
			.sort('-publishedDate')
			.populate('author boardrubrics');

		if (locals.data.boardrubric) {
			q.where('boardrubrics').in([locals.data.boardrubric]);
		}

		q.exec(function (err, results) {
			locals.data.posts = results;
			next(err);
		});
	});

	// Render the view
	view.render('board');
};
