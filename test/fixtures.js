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
				},
				name : "single item",
				description : "A single item"
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
			},
			curie : {
				name : "cmds",
				href : "/tasklist/{rel}",
				templated : true
			},
			"cmds:create-new" : {
				href : "#_commands/create-task"
			}
		},
		Count : 3,
		_commands : {
			"create-task" : {
				href : "/tasklist/create",
				method : "POST",
				encoding : "application/x-www-form-urlencoded",
				properties : {
					'description' : '',
					'etag' : 'adefdfad34246736'
				}
			}
		},
		_embedded : {
			"task" : [
				{
					_links : {
						self : {
							href: "/tasks/1"
						},
						curie : {
							name : "cmds",
							href : "/tasks/1/rels/{rel}",
							templated : true
						},
						"cmds:complete" : {
							href : '#_commands/complete-some-task'
						},
						"cmds:edit" : {
							href : '#_commands/edit-task'
						},
						"cmds:delete" : {
							href : '#_commands/delete-task'
						},
					},
					description : "Do this task",
					tasktype : "Default priority",
					created : 1381580070704,
					last_updated : 1381580103672,
					etag : "adefdfad34246736",
					_commands : {
						"complete-some-task" : {
							href : "/tasks/1/complete",
							method : "PUT",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								'etag' : "adefdfad34246736"
							}
						},
						"delete-task" : {
							href : "delete-task",
							action : "/tasks/1/delete",
							method : "DELETE",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								'etag' : "adefdfad34246736"
							}

						},
						"edit-task" : {
							href : "/tasks/1/edit",
							method : "PUT",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								'description' : 'Do this task',
								'tasktype' : 'default',
								'etag' : 'adefdfad34246736'
							},
							schema : {
								'tasktype' : {
									options : [
										{
											name : 'Default priority',
											value : 'default'
										},
										{
											name : 'Urgent',
											value : 'urgent'
										},
										{
											name : 'File 13',
											value : 'ignore'
										}
									]
								}
							}
						}
					}
				},
				{
					_links : {
						self : {
							href: "/tasks/1"
						},
						curie : {
							name : "cmds",
							href : "/tasks/1/rels/{rel}",
							templated : true
						},
						"cmds:complete" : {
							href : '#_commands/complete-some-task'
						},
						"cmds:edit" : {
							href : '#_commands/edit-task'
						},
						"cmds:delete" : {
							href : '#_commands/delete-task'
						},
					},
					description : "Do this task",
					tasktype : "Default priority",
					created : 1381580070704,
					last_updated : 1381580103672,
					etag : "adefdfad34246736",
					_commands : {
						"complete-some-task" : {
							href : "/tasks/1/complete",
							method : "PUT",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								'etag' : "adefdfad34246736"
							}
						},
						"delete-task" : {
							href : "delete-task",
							action : "/tasks/1/delete",
							method : "DELETE",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								'etag' : "adefdfad34246736"
							}

						},
						"edit-task" : {
							href : "/tasks/1/edit",
							method : "PUT",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								'description' : 'Do this task',
								'tasktype' : 'default',
								'etag' : 'adefdfad34246736'
							},
							schema : {
								'tasktype' : {
									options : [
										{
											name : 'Default priority',
											value : 'default'
										},
										{
											name : 'Urgent',
											value : 'urgent'
										},
										{
											name : 'File 13',
											value : 'ignore'
										}
									]
								}
							}
						}
					}
				},
				{
					_links : {
						self : {
							href: "/tasks/3"
						},
						curie : {
							name : "cmds",
							href : "/tasks/3/rels/{rel}",
							templated : true
						},
						"cmds:complete" : {
							href : '#_commands/complete-yet-another-type-of-task'
						},
						"cmds:edit" : {
							href : '#_commands/edit-task'
						},
						"cmds:delete" : {
							href : '#_commands/delete-task'
						}
					},
					description : "Do this task",
					tasktype : "Default priority",
					created : 1381580070704,
					last_updated : 1381679058602,
					etag : "1758475ecdacdeacddecac",
					_commands : {
						"complete-yet-another-type-of-task" : {
							href : "/tasks/3/complete",
							method : "PUT",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								'etag' : "1758475ecdacdeacddecac"
							}
						},
						"delete-task" : {
							href : "/tasks/3/delete",
							method : "DELETE",
							encoding : "application/x-www-form-urlencoded",
							properties : {  
								"etag": "1758475ecdacdeacddecac"
							}
						},
						"edit-task" : {
							href : "/tasks/3/edit",
							method : "PUT",
							encoding : "application/x-www-form-urlencoded",
							properties : {
								"description" : "Do this task",
								"tasktype" : "default",
								"etag" : '1758475ecdacdeacddecac'
							},						
							schema : {
								'tasktype' : {
									options : [
										{
											name : 'Default priority',
											value : 'default'
										},
										{
											name : 'Urgent',
											value : 'urgent'
										},
										{
											name : 'File 13',
											value : 'ignore'
										}
									]
								}
							}
						}
					}
				}
			]
		}
	}

};

module.exports = function(id){

	return JSON.parse( JSON.stringify(fixtures[id]) );

};