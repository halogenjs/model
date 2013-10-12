var fixtures = {
	"/services_curie" : {
		_links : {
			self : {
				href : "/services"
			},
			curie : {
				name : "app",
				templated : true,
				href : "/services/rels/{rel}"
			},
			"app:test" : {
				href : "/services/test"
			},
			"app:helloworld" : {
				href : "/services/helloworld"
			},
			"app:thing" : {
				href : "/services/thing/{id}",
				templated: true
			}
		}

	},
	"/services_curies" : {
		_links : {
			self : {
				href : "/services"
			},
			curies : [
				{
					name : "app",
					templated : true,
					href : "/services/rels/{rel}"
				}
			],
			"app:test" : {
				href : "/services/test"
			},
			"app:helloworld" : {
				href : "/services/helloworld"
			},
			"app:thing" : {
				href : "/services/thing/{id}",
				templated: true
			}
		}

	},

	"/attribute-test" : {
		_links : {
			self : {
				href : "/attribute-test"
			}
		},
		anObject : {
			name : "name inside an object",
			description : "description inside an object"

		},
		anArrayofObjects : [
			{
				name : "obj 1",
				description: "desc 1"
			},
			{
				name : "obj 2",
				description : "desc 2"
			},
			{
				name : "obj 3",
				description : "desc 3"
			}
		]
	},

	"/embed-test" : {
		_links : {
			self : {
				href : "/embed-test"
			}
		},
		_embedded : {
			"single-item" : {
				_links : {
					self : {
						href : "/single-item"
					},
					name : "single item",
					description : "A single item"
				}
			},
			"multiple-items" : [
				{
					_links : {
						self : {
							href : "/items/1"
						}
					},
					name : "Item one",
					description: "Item one of many"
				},
				{
					_links : {
						self : {
							href : "/items/2"
						}
					},
					name : "Item two",
					description: "Item two of many"
				},
				{
					_links : {
						self : {
							href : "/items/3"
						}
					},
					name : "Item three",
					description: "Item three of many"
				}
			]
		}

	},

	"/tasklist" : {
		_links : {
			self : {
				href : "/tasklist"
			}
		},
		Count : 5,
		_controls : {
			edit : [
				{
					name : "create-task",
					action : "/tasklist/create",
					method : "POST",
					encoding : "application/x-www-form-urlencoded",
					properties : [
						{
							name : "description",
							type : "text",
							value : "",
							placeholder : "Add description here",
							required : "required"
						},
						{
							name : "etag",
							type : "hidden",
							value : "adefdfad34246736"
						},
						{
							name : "submit",
							type : "submit",
							value : "Save"
						}
					]
				}
			]
		},
		_embedded : {
			"task" : [
				{
					_links : {
						self : {
							href: "/tasks/1"
						},
						description : "Do this task",
						created : 1381580070704,
						last_updated : 1381580103672,
						etag : "adefdfad34246736",
						_controls : {
							edit : [
								{
									name : "complete-task",
									action : "/tasks/1/complete",
									method : "PUT",
									encoding : "application/x-www-form-urlencoded",
									properties : [
										{
											name : "etag",
											type : "hidden",
											value : "adefdfad34246736"
										},
										{
											name : "submit",
											type : "submit",
											value : "Complete"
										}
									]
								},
								{
									name : "delete-task",
									action : "/tasks/1/delete",
									method : "DELETE",
									encoding : "application/x-www-form-urlencoded",
									properties : [
										{
											name : "etag",
											type : "hidden",
											value : "adefdfad34246736"
										},
										{
											name : "submit",
											type : "submit",
											value : "Delete"
										}
									]

								},
								{
									name : "edit-task",
									action : "/tasks/1/edit",
									method : "PUT",
									encoding : "application/x-www-form-urlencoded",
									properties : [
										{
											name : "description",
											type : "text",
											value : "Do this task",
											placeholder : "Add description here",
											required : "required"
										},
										{
											name : "etag",
											type : "hidden",
											value : "adefdfad34246736"
										},
										{
											name : "submit",
											type : "submit",
											value : "Save"
										}
									]

								}
							]
						}
					}
				},
				{
					_links : {
						self : {
							href: "/tasks/2"
						},
						description : "Do this other task",
						created : 1381580103672,
						last_updated : 1381580103672,
						etag : "aeeefdfeef12376517623",
						_controls : {
							edit : [
								{
									name : "complete-task",
									action : "/tasks/2/complete",
									method : "PUT",
									encoding : "application/x-www-form-urlencoded",
									properties : [
										{
											name : "etag",
											type : "hidden",
											value : "aeeefdfeef12376517623"
										},
										{
											name : "submit",
											type : "submit",
											value : "Complete"
										}
									]
								},
								{
									name : "delete-task",
									action : "/tasks/2/delete",
									method : "DELETE",
									encoding : "application/x-www-form-urlencoded",
									properties : [
										{
											name : "etag",
											type : "hidden",
											value : "aeeefdfeef12376517623"
										},
										{
											name : "submit",
											type : "submit",
											value : "Delete"
										}
									]

								},
								{
									name : "edit-task",
									action : "/tasks/2/edit",
									method : "PUT",
									encoding : "application/x-www-form-urlencoded",
									properties : [
										{
											name : "description",
											type : "text",
											value : "Do this other task",
											placeholder : "Add description here",
											required : "required"
										},
										{
											name : "etag",
											type : "hidden",
											value : "aeeefdfeef12376517623"
										},
										{
											name : "submit",
											type : "submit",
											value : "Save"
										}
									]

								}
							]
						}
					}
				},
				{
					_links : {
						self : {
							href: "/tasks/3"
						},
						description : "Put the lotion in the basket",
						created : 1381580070704,
						last_updated : 1381580070704,
						etag : "adbcaecbfabcdbfcabecd",
						_controls : {
							edit : [
								{
									name : "complete-task",
									action : "/tasks/3/complete",
									method : "PUT",
									encoding : "application/x-www-form-urlencoded",
									properties : [
										{
											name : "etag",
											type : "hidden",
											value : "adbcaecbfabcdbfcabecd"
										},
										{
											name : "submit",
											type : "submit",
											value : "Complete"
										}
									]
								},
								{
									name : "delete-task",
									action : "/tasks/3/delete",
									method : "DELETE",
									encoding : "application/x-www-form-urlencoded",
									properties : [
										{
											name : "etag",
											type : "hidden",
											value : "adbcaecbfabcdbfcabecd"
										},
										{
											name : "submit",
											type : "submit",
											value : "Delete"
										}
									]

								},
								{
									name : "edit-task",
									action : "/tasks/3/edit",
									method : "PUT",
									encoding : "application/x-www-form-urlencoded",
									properties : [
										{
											name : "description",
											type : "text",
											value : "Put the lotion in the basket",
											placeholder : "Add description here",
											required : "required"
										},
										{
											name : "etag",
											type : "hidden",
											value : "adbcaecbfabcdbfcabecd"
										},
										{
											name : "submit",
											type : "submit",
											value : "Save"
										}
									]

								}
							]
						}
					}
				},
				{
					_links : {
						self : {
							href: "/tasks/4"
						},
						description : "Make fetch happen",
						created : 1381580103672,
						last_updated : 1381580103672,
						etag : "dccbacdcccbdcbacbedcbceabdcab",
						_controls : {
							edit : [
								{
									name : "complete-task",
									action : "/tasks/4/complete",
									method : "PUT",
									encoding : "application/x-www-form-urlencoded",
									properties : [
										{
											name : "etag",
											type : "hidden",
											value : "dccbacdcccbdcbacbedcbceabdcab"
										},
										{
											name : "submit",
											type : "submit",
											value : "Complete"
										}
									]
								},
								{
									name : "delete-task",
									action : "/tasks/4/delete",
									method : "DELETE",
									encoding : "application/x-www-form-urlencoded",
									properties : [
										{
											name : "etag",
											type : "hidden",
											value : "dccbacdcccbdcbacbedcbceabdcab"
										},
										{
											name : "submit",
											type : "submit",
											value : "Delete"
										}
									]

								},
								{
									name : "edit-task",
									action : "/tasks/4/edit",
									method : "PUT",
									encoding : "application/x-www-form-urlencoded",
									properties : [
										{
											name : "description",
											type : "text",
											value : "Make fetch happen",
											placeholder : "Add description here",
											required : "required"
										},
										{
											name : "etag",
											type : "hidden",
											value : "dccbacdcccbdcbacbedcbceabdcab"
										},
										{
											name : "submit",
											type : "submit",
											value : "Save"
										}
									]

								}
							]
						}
					}
				},
				{
					_links : {
						self : {
							href: "/tasks/5"
						},
						description : "Finish making stupid hyperbone fixtures",
						created : 1381580103672,
						last_updated : 1381580103672,
						etag : "cebcebcbfbcebcbfbfbcbbaaabcbebf",
						_controls : {
							edit : [
								{
									name : "complete-task",
									action : "/tasks/5/complete",
									method : "PUT",
									encoding : "application/x-www-form-urlencoded",
									properties : [
										{
											name : "etag",
											type : "hidden",
											value : "cebcebcbfbcebcbfbfbcbbaaabcbebf"
										},
										{
											name : "submit",
											type : "submit",
											value : "Complete"
										}
									]
								},
								{
									name : "delete-task",
									action : "/tasks/5/delete",
									method : "DELETE",
									encoding : "application/x-www-form-urlencoded",
									properties : [
										{
											name : "etag",
											type : "hidden",
											value : "cebcebcbfbcebcbfbfbcbbaaabcbebf"
										},
										{
											name : "submit",
											type : "submit",
											value : "Delete"
										}
									]

								},
								{
									name : "edit-task",
									action : "/tasks/5/edit",
									method : "PUT",
									encoding : "application/x-www-form-urlencoded",
									properties : [
										{
											name : "description",
											type : "text",
											value : "Finish making stupid hyperbone fixtures",
											placeholder : "Add description here",
											required : "required"
										},
										{
											name : "etag",
											type : "hidden",
											value : "cebcebcbfbcebcbfbfbcbbaaabcbebf"
										},
										{
											name : "submit",
											type : "submit",
											value : "Save"
										}
									]

								}
							]
						}
					}
				}
			]
		}
	},


};

var useFixture = function(id){

	return JSON.parse( JSON.stringify(fixtures[id]) );

};